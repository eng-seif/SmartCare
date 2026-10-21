import { NextResponse } from 'next/server'
import { parseChatInput, chatInstructions } from '@/lib/chat-policy'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { supabaseServer } from '@/lib/supabase/server'
import { evaluate, type Product } from '@/lib/health'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const buckets = new Map<string, { count: number; until: number }>()
const MAX_BODY = 20_000
const json = (data: object, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })

async function readBody(request: Request) {
  if (Number(request.headers.get('content-length')) > MAX_BODY) throw new Error('body-too-large')
  const reader = request.body?.getReader()
  if (!reader) return null
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_BODY) {
      await reader.cancel()
      throw new Error('body-too-large')
    }
    chunks.push(value)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  try {
    if (origin && new URL(origin).host !== host) return json({ error: 'Request origin is not allowed.' }, 403)
  } catch { return json({ error: 'Request origin is not allowed.' }, 403) }
  let body: unknown
  try { body = await readBody(request) }
  catch (error) {
    return json({ error: error instanceof Error && error.message === 'body-too-large' ? 'Message is too large.' : 'Invalid message format.' }, 400)
  }
  const input = parseChatInput(body)
  if (!input) return json({ error: 'Send 1–10 messages, up to 1500 characters each, with a language and profile preference.' }, 400)
  const ar = input.lang === 'ar'
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const now = Date.now()
  for (const [k, b] of buckets) if (b.until <= now) buckets.delete(k)
  const bucket = buckets.get(key) ?? { count: 0, until: now + 60_000 }
  if (bucket.count >= 12 || buckets.size > 5000) return json({
    error: ar ? 'وصلت لحد الرسائل المؤقت. جرّب بعد دقيقة.' : 'Too many messages. Please try again in a minute.',
  }, 429)
  bucket.count++
  buckets.set(key, bucket)
  if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !process.env.AI_INTEGRATIONS_OPENAI_API_KEY)
    return json({ error: ar ? 'خدمة المساعد غير متاحة حاليًا.' : 'The assistant is temporarily unavailable.' }, 503)

  try {
    let conditions: string[] = []
    let limits: unknown = null
    let catalogAvailable = false
    let products: Product[] = []
    let profileShared = false
    if (isSupabaseConfigured()) {
      const sb = await supabaseServer()
      if (input.useProfile) {
        const { data: { user } } = await sb.auth.getUser()
        if (!user) return json({ error: ar ? 'سجّل الدخول لاستخدام ملفك الصحي، أو ألغِ الاختيار.' : 'Sign in to use your profile, or turn that option off.' }, 401)
        const { data: profile, error } = await sb.from('profiles')
          .select('conditions,max_sugar_g,max_carbs_g,max_sodium_mg').eq('id', user.id).maybeSingle()
        if (error) throw new Error('profile-unavailable')
        if (!profile) return json({ error: ar ? 'أكمل ملفك الصحي أولًا أو ألغِ الاختيار.' : 'Complete your health profile first, or turn the option off.' }, 409)
        conditions = profile.conditions ?? []
        limits = { sugar: profile.max_sugar_g, carbs: profile.max_carbs_g, sodium: profile.max_sodium_mg }
        profileShared = true
      }
      const { data, error } = await sb.from('products').select('*').order('title').limit(80)
      if (!error) { products = (data ?? []) as Product[]; catalogAvailable = true }
    } else if (input.useProfile) {
      return json({ error: ar ? 'ملفك الصحي غير متصل. ألغِ الاختيار لاستخدام المساعد العام.' : 'Your profile is not connected. Turn the option off for general guidance.' }, 409)
    }
    // Rank this bounded sample against the actual question. No model-authored inventory.
    const terms = input.messages.at(-1)!.content.toLowerCase().split(/\s+/).filter(t => t.length > 2)
    const score = (p: Product) => terms.reduce((s, t) => s + Number(`${p.title} ${p.category}`.toLowerCase().includes(t)), 0)
    const catalog = [...products].sort((a, b) => score(b) - score(a)).slice(0, 24).map(p => ({
      title: p.title, category: p.category, price: p.price, serving: p.serving_size ?? null,
      sugar_g: p.sugar_content, carbs_g: p.net_carbs, sodium_mg: p.sodium_content,
      gi: p.glycemic_index, gl: p.glycemic_load, saturatedFat_g: p.sat_fat_g ?? null,
      lactoseFree: p.is_lactose_free, glutenFree: p.is_gluten_free,
      screening: evaluate(p, conditions),
    }))
    const { openai } = await import('@workspace/integrations-openai-ai-server')
    const response = await openai.chat.completions.create({
      model: 'gpt-5.4-mini',
      max_completion_tokens: 8192,
      messages: [
        { role: 'system', content: chatInstructions(input.lang, { catalogAvailable, profileShared, conditions, limits, catalog }) },
        ...input.messages,
      ],
    }, { timeout: 35_000, maxRetries: 0, signal: request.signal })
    const reply = response.choices[0]?.message?.content?.trim()
    if (!reply) throw new Error('empty-response')
    return json({ reply, catalogAvailable })
  } catch {
    // Do not log health information, conversation bodies, or provider credentials.
    return json({ error: ar ? 'تعذّر الرد حاليًا. جرّب تاني بعد لحظات.' : 'The assistant could not reply. Please try again shortly.' }, 503)
  }
}
