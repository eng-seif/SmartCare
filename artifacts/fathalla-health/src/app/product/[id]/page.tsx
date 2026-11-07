import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import { evaluate, n, nutrition, type Product } from '@/lib/health'
import { TONE } from '@/components/HealthBadge'
import AddToCartButton from '@/components/AddToCartButton'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import ConnectionNotice from '@/components/ConnectionNotice'
import CatalogReferenceNotice from '@/components/CatalogReferenceNotice'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return <ConnectionNotice />
  const { id } = await params
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  const { data: profile } = user ? await sb.from('profiles').select('conditions, full_name').eq('id', user.id).single() : { data: null }
  const c: string[] = profile?.conditions ?? []
  const { data: p } = await sb.from('products').select('*').eq('id', id).single<Product>()
  if (!p) notFound()
  const { verdict, reasons } = evaluate(p, c)
  const t = TONE[verdict]

  const { data: links } = await sb.from('alternative_products')
    .select('reason, alt:products!healthy_alternative_id(*)').eq('original_product_id', p.id)
  let alts: { p: Product; reason?: string }[] = (links ?? []).filter((l: any) => l.alt).map((l: any) => ({ p: l.alt as Product, reason: l.reason }))
  if (!alts.length) {
    const { data: others } = await sb.from('products').select('*').eq('category', p.category ?? '').neq('id', p.id)
    alts = ((others ?? []) as Product[]).filter(o => evaluate(o, c).verdict === 'safe')
      .sort((x, y) => n(x.sugar_content) - n(y.sugar_content)).slice(0, 3).map(x => ({ p: x }))
  }
  alts = alts.filter(a => evaluate(a.p, c).verdict === 'safe')

  const metrics = [
    ['Glycemic Index', nutrition(p.glycemic_index), 'GI'], ['Glycemic Load', nutrition(p.glycemic_load), 'GL'], ['Health Score', nutrition(p.health_score), '/100'],
  ]
  const nutrients = [
    ['Sugar', nutrition(p.sugar_content, 'g')], ['Net Carbs', nutrition(p.net_carbs, 'g')], ['Sodium', nutrition(p.sodium_content, 'mg')],
    ['Lactose / Gluten', `${p.is_lactose_free === true ? 'Lactose-free' : p.is_lactose_free === false ? 'Has lactose' : 'Lactose status unknown'} · ${p.is_gluten_free === true ? 'Gluten-free' : p.is_gluten_free === false ? 'Has gluten' : 'Gluten status unknown'}`],
  ]

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-margin-desktop py-space-lg flex flex-col gap-space-xl">
      <nav className="flex items-center gap-space-xs font-body-sm text-body-sm text-secondary">
        <Link href="/" className="hover:text-primary">Store</Link>
        <span className="material-symbols-outlined text-sm text-outline-variant">chevron_right</span>
        <span>{p.category}</span>
        <span className="material-symbols-outlined text-sm text-outline-variant">chevron_right</span>
        <span className="text-on-surface font-semibold">{p.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-surface-variant/40 flex flex-col gap-space-md">
            <div className="flex items-start gap-space-md">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${t.soft}`}>
                <span className={`material-symbols-outlined text-2xl ${t.text}`}>{verdict === 'safe' ? 'verified' : 'warning'}</span>
              </div>
              <div className="flex flex-col">
                <span className={`font-label-sm text-label-sm uppercase tracking-wider font-bold ${t.text}`}>Health Verdict</span>
                <h1 className="font-headline-sm text-headline-sm text-on-surface">{t.title}</h1>
                {!user && <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">Create a health profile to personalize this verdict.</p>}
              </div>
            </div>
            {reasons.length > 0 && (
              <div className="p-space-md rounded-lg bg-surface-container-low flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-lg mt-0.5 shrink-0">info</span>
                <ul className="font-body-sm text-body-sm text-on-surface list-disc ps-4">{reasons.map(r => <li key={r}>{r}</li>)}</ul>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
            {metrics.map(([k, v, u]) => (
              <div key={k as string} className="p-space-md rounded-xl bg-surface-container-lowest border border-surface-variant/40 shadow-sm flex flex-col gap-space-xs">
                <span className="font-label-sm text-label-sm text-secondary font-medium">{k}</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-metric-display text-metric-display text-on-surface">{v}</span>
                  <span className="font-label-sm text-label-sm text-secondary">{u}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-variant/40 shadow-sm flex flex-col gap-space-md">
            <h2 className="font-title-md text-title-md text-on-surface font-bold">Nutrient Breakdown{p.serving_size ? <span className="font-body-md text-body-md text-secondary font-normal"> · per {p.serving_size}</span> : null}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-md">
              {nutrients.map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5 p-space-sm rounded-lg bg-surface-container-low">
                  <span className="font-label-sm text-label-sm text-secondary">{k}</span>
                  <span className="font-metric-display text-body-md text-on-surface">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-space-md sticky top-24">
          <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-surface-variant/40 flex flex-col gap-space-lg">
            <div className="relative w-full h-64 rounded-lg bg-surface-container-low overflow-hidden">
              {p.image_url && <img className="w-full h-full object-cover" src={p.image_url} alt={p.title} />}
              <span className={`absolute top-space-sm right-space-sm px-space-sm py-0.5 rounded font-label-sm text-label-sm font-bold ${t.chip}`}>{t.label}</span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm text-secondary font-medium tracking-wide uppercase">Fathalla Health Aisle</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">{p.title}</h2>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-metric-display text-metric-display text-on-surface font-bold">{Number(p.price).toFixed(2)}</span>
                <span className="font-title-md text-title-md text-on-surface font-semibold">EGP</span>
              </div>
            </div>
            <AddToCartButton productId={p.id} label={verdict === 'safe' ? 'Add to Cart' : 'Add to Cart Anyway'} className="w-full" />
            <CatalogReferenceNotice title={p.title} />
          </div>
        </div>
      </div>

      {alts.length > 0 && (
        <div className="flex flex-col gap-space-lg pt-space-xl">
          <div>
            <div className="inline-flex items-center gap-space-xs text-tertiary font-label-sm text-label-sm font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-base">verified</span>Smart Dietary Swaps
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Healthier Alternatives for You</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            {alts.map(({ p: a, reason }) => (
              <div key={a.id} className="rounded-xl bg-surface-container-lowest p-space-md border border-surface-variant/40 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-space-md">
                <div className="flex flex-col gap-space-md">
                  <Link href={`/product/${a.id}`} className="relative w-full h-48 rounded-lg bg-surface-container-low overflow-hidden block">
                    {a.image_url && <img className="w-full h-full object-cover" src={a.image_url} alt={a.title} />}
                    <span className="absolute bottom-2 left-2 px-space-xs py-0.5 rounded bg-surface-container-lowest/90 font-metric-label text-metric-label text-tertiary font-bold">GI: {nutrition(a.glycemic_index)}</span>
                  </Link>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-title-lg text-title-lg text-on-surface font-bold">{a.title}</h3>
                    {reason && <span className="font-label-md text-label-md text-tertiary font-semibold">{reason}</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-1 p-space-xs rounded-lg bg-surface-container-low text-center">
                    {[['SUGAR', nutrition(a.sugar_content, 'g')], ['NET CARBS', nutrition(a.net_carbs, 'g')], ['SODIUM', nutrition(a.sodium_content, 'mg')]].map(([k, v]) => (
                      <div key={k} className="flex flex-col py-1"><span className="font-metric-label text-metric-label text-secondary">{k}</span><span className="font-metric-display text-body-md text-on-surface">{v}</span></div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-metric-display text-metric-display text-on-surface font-bold">{Number(a.price).toFixed(2)} <span className="font-body-sm text-body-sm">EGP</span></span>
                  <AddToCartButton productId={a.id} label="Swap & Add" icon="swap_horiz" className="h-11" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
