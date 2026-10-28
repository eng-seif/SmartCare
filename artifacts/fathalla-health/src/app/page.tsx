import { supabaseServer } from '@/lib/supabase/server'
import MarketClient from '@/components/MarketRefresh'
import { type Product } from '@/lib/health'
import { assessCart } from '@/lib/cart-status'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import ConnectionNotice from '@/components/ConnectionNotice'
import { cookies } from 'next/headers'

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const lang = (await cookies()).get('lang')?.value === 'ar' ? 'ar' : 'en'
  if (!isSupabaseConfigured()) {
    return <>
      <ConnectionNotice />
      <MarketClient lang={lang} rows={[]} conditions={[]} monitor={{
        loggedIn: false, level: 'empty', unsafe: 0, items: 0,
        rows: [
          { label: 'Added sugar', value: 0, max: 15, unit: 'g' },
          { label: 'Net carbs', value: 0, max: 50, unit: 'g' },
          { label: 'Sodium', value: 0, max: 1500, unit: 'mg' },
        ],
      }} />
    </>
  }
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  const { data: profile } = user ? await sb.from('profiles').select('conditions, max_sugar_g, max_carbs_g, max_sodium_mg').eq('id', user.id).maybeSingle() : { data: null }
  const conditions: string[] = profile?.conditions ?? []
  const lim = { sugar: Number(profile?.max_sugar_g ?? 15), carbs: Number(profile?.max_carbs_g ?? 50), sodium: Number(profile?.max_sodium_mg ?? 1500) }
  const { data: rows } = await sb.from('products').select('*').order('title')
  const { data: cart } = user ? await sb.from('cart_items').select('qty, product:products(*)') : { data: [] }
  const items: { qty: number; product: Product }[] = (cart ?? []).map((r: any) => ({ qty: r.qty, product: r.product })).filter((i: any) => i.product)
  const a = assessCart(items, conditions, lim)
  const monitor = {
    loggedIn: !!user, level: a.level, unsafe: a.risky.length, items: items.reduce((s, i) => s + i.qty, 0),
    rows: [
      { label: 'Added sugar', value: a.t.sugar, max: lim.sugar, unit: 'g' },
      { label: 'Net carbs', value: a.t.carbs, max: lim.carbs, unit: 'g' },
      { label: 'Sodium', value: a.t.sodium, max: lim.sodium, unit: 'mg' },
    ],
  }
  return <MarketClient lang={lang} rows={(rows ?? []) as Product[]} conditions={conditions} monitor={monitor} initialQuery={q.slice(0, 200)} />
}
