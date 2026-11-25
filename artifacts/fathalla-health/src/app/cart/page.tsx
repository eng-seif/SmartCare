import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import { evaluate, CONDITIONS, type Product } from '@/lib/health'
import { assessCart, normalizeLimits, intakePercent } from '@/lib/cart-status'
import HealthBadge from '@/components/HealthBadge'
import CartItemControls from '@/components/CartItemControls'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import ConnectionNotice from '@/components/ConnectionNotice'

const Bar = ({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) => {
  const over = value > max
  const warn = !over && value >= max * 0.7 && value > 0
  return (
    <div className="flex flex-col gap-space-xs">
      <div className="flex justify-between items-baseline">
        <span className="font-body-md text-body-md text-on-surface font-semibold">{label}</span>
        <span className={`font-metric-display text-base font-bold ${over ? 'text-error' : warn ? 'text-primary' : 'text-tertiary'}`}>{+value.toFixed(1)}{unit} <span className="text-xs text-secondary font-normal">/ {max}{unit} limit</span></span>
      </div>
      <div className="w-full h-2.5 bg-surface-container-low rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${over ? 'bg-error' : warn ? 'bg-primary-container' : 'bg-tertiary'}`} style={{ width: `${Math.min(100, intakePercent(value, max))}%` }}></div>
      </div>
    </div>
  )
}

export default async function CartPage() {
  if (!isSupabaseConfigured()) return <ConnectionNotice />
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/register')
  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle()
  const { data } = await sb.from('cart_items').select('qty, product:products(*)')
  const items: { qty: number; product: Product }[] = (data ?? []).map((r: any) => ({ qty: r.qty as number, product: r.product as Product }))
  const c: string[] = profile?.conditions ?? []
  const lim = normalizeLimits({ sugar: Number(profile?.max_sugar_g ?? 15), carbs: Number(profile?.max_carbs_g ?? 50), sodium: Number(profile?.max_sodium_mg ?? 1500) })
  const a = assessCart(items, c, lim)
  const { t, risky } = a
  const ST = {
    empty: { soft: 'bg-surface-container-high', text: 'text-on-surface-variant', icon: 'shopping_cart', title: 'Your cart is empty' },
    safe: { soft: 'bg-tertiary-fixed/30', text: 'text-tertiary', icon: 'shield', title: 'Cart is within your limits' },
    caution: { soft: 'bg-primary-fixed/50', text: 'text-primary', icon: 'info', title: 'Review portions or missing label data' },
    over: { soft: 'bg-error-container', text: 'text-error', icon: 'warning', title: 'Review before checkout' },
  }
  const st = ST[a.level]

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-margin-tablet lg:px-margin-desktop py-space-lg">
      <section className="flex flex-col gap-space-xs mb-space-xl">
        <div className="flex items-center gap-space-xs text-primary font-label-sm uppercase tracking-wider">
          <span className="material-symbols-outlined text-base">clinical_notes</span><span>Metabolic Wellness Architecture</span>
        </div>
        <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Personalized Health Profile &amp; Interactive Smart Cart</h1>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
        <section className="lg:col-span-6 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-variant/40 flex items-center gap-space-md">
            <div className="w-16 h-16 rounded-full bg-primary-container text-white flex items-center justify-center font-headline-md text-headline-md ring-2 ring-tertiary">
              {(profile?.full_name ?? user.email ?? '?')[0].toUpperCase()}
            </div>
            <div className="flex flex-col gap-space-xs">
              <span className="font-title-lg text-title-lg text-on-surface font-bold">{profile?.full_name ?? user.email}</span>
              <div className="flex flex-wrap gap-space-xs">
                {c.length === 0 && <span className="font-body-md text-secondary">No conditions selected</span>}
                {c.map(k => <span key={k} className="px-space-md py-space-xs rounded-full bg-surface-container text-on-surface font-label-md">{CONDITIONS[k] ?? k}</span>)}
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-variant/40 flex flex-col gap-space-lg">
            <div className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-primary">tune</span><h2 className="font-title-lg text-title-lg text-on-surface font-bold">Target Intake Safeguards</h2></div>
            <Bar label="Sugar screening limit" value={t.sugar} max={lim.sugar} unit="g" />
            <Bar label="Max Net Carbs" value={t.carbs} max={lim.carbs} unit="g" />
            <Bar label="Sodium screening limit" value={t.sodium} max={lim.sodium} unit="mg" />
            <p className="text-xs text-on-surface-variant">Cart totals are per item serving × quantity, not a record of your whole day. Limits are screening targets, not medical prescriptions.</p>
          </div>
        </section>

        <section className="lg:col-span-6 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-variant/40 flex items-center gap-space-md">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${st.soft}`}>
              <span className={`material-symbols-outlined text-3xl ${st.text}`}>{st.icon}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-secondary uppercase tracking-wider font-semibold">Real-Time Cart Screening</span>
              <span className="font-headline-md text-headline-md text-on-surface font-bold">{st.title}</span>
              {a.notes.map(note => <p key={note} className="font-body-sm text-body-sm text-on-surface-variant">{note}</p>)}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-variant/40 flex flex-col gap-space-md">
            <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Inspected Cart Items ({items.reduce((s, i) => s + i.qty, 0)})</h3>
            {items.length === 0 && <p className="font-body-md text-secondary">Your cart is empty. <Link href="/" className="text-primary font-semibold">Browse the market</Link> or <Link href="/scanner" className="text-primary font-semibold">scan a barcode</Link>.</p>}
            {items.map(({ qty, product: p }) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                <Link href={`/product/${p.id}`} className="flex items-center gap-space-md min-w-0">
                  <div className="w-14 h-14 rounded-lg bg-white overflow-hidden shrink-0">{p.image_url && <img className="w-full h-full object-cover" src={p.image_url} alt={p.title} />}</div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-title-md text-title-md text-on-surface font-semibold">{p.title}</span>
                    <div className="flex items-center gap-space-xs"><HealthBadge verdict={evaluate(p, c).verdict} /><span className="text-secondary font-label-sm">{Number(p.price).toFixed(2)} each</span></div>
                  </div>
                </Link>
                <div className="flex items-center justify-between sm:justify-end gap-space-md">
                  <CartItemControls productId={p.id} qty={qty} />
                  <span className="font-metric-display text-base text-on-surface font-bold w-24 text-right">{(p.price * qty).toFixed(2)} <span className="text-xs font-normal text-secondary">EGP</span></span>
                </div>
              </div>
            ))}
            {risky.length > 0 && (
              <div className="p-space-md rounded-lg bg-error-container text-on-error-container font-body-md">
                <b>Heads up:</b> {risky.map(r => r.product.title).join(', ')} {risky.length > 1 ? 'are' : 'is'} not recommended for your profile.
              </div>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-variant/40 flex flex-col gap-space-md">
            <div className="flex justify-between items-baseline">
              <span className="font-title-lg text-title-lg text-on-surface font-bold">Total</span>
              <span className="font-metric-display text-metric-display text-primary font-bold">{t.price.toFixed(2)} <span className="text-sm font-normal text-secondary">EGP</span></span>
            </div>
            <button className="w-full h-12 bg-primary-container hover:bg-primary text-white font-title-md text-title-md font-bold rounded-lg shadow-md active:scale-[0.98] flex items-center justify-center gap-space-xs" type="button">
              <span>Proceed to Secure Health Checkout</span><span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
