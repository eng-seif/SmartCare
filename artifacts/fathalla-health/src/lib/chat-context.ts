import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChatInput } from './chat-policy'
import { evaluate, type Product } from './health'

export class ChatContextError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

/** Read-only, request-scoped context. Verified identity does not imply profile consent. */
export async function loadChatContext(sb: SupabaseClient | null, input: ChatInput) {
  const ar = input.lang === 'ar'
  let userId: string | undefined
  let conditions: string[] = []
  let limits: unknown = null
  let catalogAvailable = false
  let products: Product[] = []
  let profileShared = false
  if (sb) {
    const { data: { user }, error: authError } = await sb.auth.getUser()
    // Never downgrade a failed account verification to a fresh guest quota.
    if (authError && authError.name !== 'AuthSessionMissingError') throw new Error('auth-unavailable')
    userId = user?.id
    if (input.useProfile) {
      if (!user) throw new ChatContextError(401, ar ? 'سجّل الدخول لاستخدام ملفك الصحي، أو ألغِ الاختيار.' : 'Sign in to use your profile, or turn that option off.')
      const { data: profile, error } = await sb.from('profiles')
        .select('conditions,max_sugar_g,max_carbs_g,max_sodium_mg').eq('id', user.id).maybeSingle()
      if (error) throw new Error('profile-unavailable')
      if (!profile) throw new ChatContextError(409, ar ? 'أكمل ملفك الصحي أولًا أو ألغِ الاختيار.' : 'Complete your health profile first, or turn the option off.')
      conditions = profile.conditions ?? []
      limits = { sugar: profile.max_sugar_g, carbs: profile.max_carbs_g, sodium: profile.max_sodium_mg }
      profileShared = true
    }
    // Catalog failure must not disable text-only general guidance.
    try {
      const { data, error } = await sb.from('products').select('*').order('title').limit(80)
      if (!error) { products = (data ?? []) as Product[]; catalogAvailable = true }
    } catch { /* No inventory is supplied on a transport failure. */ }
  } else if (input.useProfile) {
    throw new ChatContextError(409, ar ? 'ملفك الصحي غير متصل. ألغِ الاختيار لاستخدام المساعد العام.' : 'Your profile is not connected. Turn the option off for general guidance.')
  }
  const terms = input.messages.at(-1)!.content.toLowerCase().split(/\s+/).filter(t => t.length > 2)
  const score = (p: Product) => terms.reduce((s, t) => s + Number(`${p.title} ${p.category}`.toLowerCase().includes(t)), 0)
  const catalog = [...products].sort((a, b) => score(b) - score(a)).slice(0, 24).map(p => ({
    title: p.title, category: p.category, price: p.price, serving: p.serving_size ?? null,
    sugar_g: p.sugar_content, carbs_g: p.net_carbs, sodium_mg: p.sodium_content,
    gi: p.glycemic_index, gl: p.glycemic_load, saturatedFat_g: p.sat_fat_g ?? null,
    lactoseFree: p.is_lactose_free, glutenFree: p.is_gluten_free,
    screening: evaluate(p, conditions),
  }))
  return { userId, context: { catalogAvailable, profileShared, conditions, limits, catalog } }
}
