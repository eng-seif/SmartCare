import { ReplitConnectors } from '@replit/connectors-sdk'
import { createClient } from '@supabase/supabase-js'
import { supabaseServer } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { quotaConfig, quotaSubject, limitMessage } from '@/lib/chat-quota'
import { MAX_VOICE_BYTES, wavSeconds } from '@/lib/voice-policy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const json = (value: object, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } })
export async function POST(request: Request) {
  const ar = request.headers.get('x-voice-language') === 'ar'
  const text = (a: string, e: string) => ar ? a : e
  const origin = request.headers.get('origin')
  try {
    if (origin && new URL(origin).host !== (request.headers.get('x-forwarded-host') ?? request.headers.get('host'))) return json({ error: 'Origin not allowed' }, 403)
  } catch { return json({ error: 'Origin not allowed' }, 403) }
  const auth = request.headers.get('authorization')
  if (auth && !/^Bearer \S+$/i.test(auth)) return json({ error: 'Invalid authorization' }, 401)
  if (!['ar', 'en'].includes(request.headers.get('x-voice-language') ?? '')) return json({ error: 'Choose ar or en' }, 400)
  if (!request.headers.get('content-type')?.startsWith('audio/wav')) return json({ error: 'Send a PCM WAV recording' }, 415)
  if (Number(request.headers.get('content-length')) > MAX_VOICE_BYTES) return json({ error: 'Recording too large' }, 413)
  try {
    const reader = request.body?.getReader()
    if (!reader) return json({ error: 'No recording' }, 400)
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.length
      if (size > MAX_VOICE_BYTES) { await reader.cancel(); return json({ error: 'Recording too large' }, 413) }
      chunks.push(value)
    }
    const audio = Buffer.concat(chunks)
    if (wavSeconds(audio) === null) return json({ error: text('سجّل من ثانية إلى ٣٠ ثانية، بصيغة صوت صالحة.', 'Record up to 30 seconds in a supported audio format.') }, 400)
    const token = auth?.slice(7)
    let userId: string | undefined
    if (isSupabaseConfigured()) {
      const sb = token ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } }) : await supabaseServer()
      const { data, error } = await sb.auth.getUser(token)
      if (error && (token || error.name !== 'AuthSessionMissingError')) return json({ error: 'Account verification failed' }, 401)
      userId = data.user?.id
    } else if (token) return json({ error: 'Account verification unavailable' }, 503)
    const proxyFetch = new ReplitConnectors().createProxyFetch('elevenlabs')
    // A free authorization check prevents a known-invalid connection from
    // consuming the customer's allowance or uploading microphone content.
    const health = await proxyFetch('/v1/models', { signal: AbortSignal.any([request.signal, AbortSignal.timeout(10000)]) })
    await health.body?.cancel()
    if (health.status === 401) return json({
      error: text('خدمة تحويل الصوت محتاجة تجديد الربط من إدارة الموقع. التسجيل مش هو المشكلة؛ تقدر تكتب سؤالك لحد ما الربط يتصلّح.', 'The speech service connection needs to be renewed by the site owner. Recording is not the problem; you can type your question meanwhile.'),
      code: 'VOICE_PROVIDER_AUTH',
    }, 503)
    // A key may have speech access without model-list permission (403).
    // Other service failures must not spend a customer's daily allowance.
    if (!health.ok && health.status !== 403) return json({
      error: text('خدمة تحويل الصوت مش متاحة حاليًا. المحاولة دي لم تُخصم من حصتك.', 'The speech service is unavailable. This attempt did not use your allowance.'),
      code: 'VOICE_PROVIDER_UNAVAILABLE',
    }, 503)
    const config = quotaConfig()
    const [{ pool }, { reserveChatUsage }] = await Promise.all([import('@workspace/db'), import('@workspace/db/chat-quota')])
    // Shares the persistent assistant allowance; no audio or transcripts are stored.
    // Reservation is conservative and is not refunded after a potentially billed attempt.
    const quota = await reserveChatUsage(pool, {
      subject: quotaSubject(config, request.headers, userId),
      personalLimit: userId ? config.user : config.guest,
      projectLimit: config.project, projectTokenLimit: config.tokens, tokens: 1000,
    })
    if (!quota.allowed) return json({ error: limitMessage(ar ? 'ar' : 'en', quota.scope), resetAt: quota.resetAt }, 429)
    const form = new FormData()
    form.set('model_id', 'scribe_v1')
    form.set('language_code', ar ? 'ara' : 'eng')
    form.set('tag_audio_events', 'false')
    form.set('diarize', 'false')
    form.set('file', new Blob([new Uint8Array(audio)], { type: 'audio/wav' }), 'question.wav')
    const response = await proxyFetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', body: form, signal: AbortSignal.any([request.signal, AbortSignal.timeout(35000)]) })
    if (!response.ok) throw new Error('transcription-provider-unavailable')
    const body = await response.json() as { text?: unknown }
    const transcript = typeof body.text === 'string' ? body.text.trim() : ''
    if (!transcript) return json({ error: text('لم نلتقط كلامًا واضحًا؛ حاول مجددًا أو اكتب سؤالك.', 'No clear speech detected. Try again or type your question.') }, 422)
    if (transcript.length > 1500) return json({ error: text('التسجيل طويل. جرّب سؤالًا أقصر.', 'Please record a shorter question.') }, 400)
    return json({ text: transcript })
  } catch {
    // Never log microphone content, health details or provider credentials.
    return json({ error: text('تحويل الصوت غير متاح مؤقتًا. تقدر تكتب سؤالك وتكمل.', 'Voice transcription is temporarily unavailable. You can still type your question.') }, 503)
  }
}
