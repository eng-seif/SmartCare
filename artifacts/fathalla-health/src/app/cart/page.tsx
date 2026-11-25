import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase/server'
import { type Product } from '@/lib/health'
import { enrichProduct } from '@/lib/product-nutrition'
import { normalizeLimits } from '@/lib/cart-status'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import ConnectionNotice from '@/components/ConnectionNotice'
import CartView from '@/components/CartView'

export const dynamic = 'force-dynamic'

export default async function CartPage() {
  if (!isSupabaseConfigured()) return <ConnectionNotice />
  const lang = (await cookies()).get('lang')?.value === 'ar' ? 'ar' : 'en'
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/register')

  const [{ data: profile }, { data }] = await Promise.all([
    sb.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    sb.from('cart_items').select('qty, product:products(*)'),
  ])

  const items: { qty: number; product: Product }[] = (data ?? [])
    .filter((r: any) => r.product)
    .map((r: any) => ({ qty: r.qty as number, product: enrichProduct(r.product as Product) }))
  const c: string[] = profile?.conditions ?? []
  const lim = normalizeLimits({
    sugar: Number(profile?.max_sugar_g ?? 15),
    carbs: Number(profile?.max_carbs_g ?? 50),
    sodium: Number(profile?.max_sodium_mg ?? 1500),
  })

  return (
    <CartView
      initialItems={items}
      conditions={c}
      limits={lim}
      userDisplayName={profile?.full_name || user.email || '?'}
      lang={lang}
    />
  )
}
