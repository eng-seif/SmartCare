'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Barcode, CheckCircle2, HeartPulse, Info, Package, ShoppingCart, Sparkles } from 'lucide-react'
import { evaluate, nutrition, type Product } from '@/lib/health'
import { enrichProduct } from '@/lib/product-nutrition'
import { translate } from '@/lib/i18n-ar'
import { supabaseBrowser } from '@/lib/supabase/client'
import HealthChat from './HealthChat'
import CatalogReferenceNotice from './CatalogReferenceNotice'

type Props = {
  lang: 'ar' | 'en'; rows: Product[]; conditions: string[]
  initialCartMap?: Record<string, number>
  monitor: { loggedIn: boolean; [key: string]: unknown }; initialQuery?: string
}

/** Approved visual treatment, backed by the original catalog, auth and screening rules. */
export default function MarketRefresh({ lang, rows, conditions, initialCartMap = {}, monitor, initialQuery = '' }: Props) {
  const ar = lang === 'ar'
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState('')
  const [cartMap, setCartMap] = useState<Record<string, number>>(initialCartMap)
  const [notice, setNotice] = useState('')
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const text = (en: string) => ar ? translate(en) : en

  useEffect(() => {
    setCartMap(initialCartMap)
  }, [initialCartMap])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 3000)
    return () => clearTimeout(timer)
  }, [notice])

  const enrichedRows = useMemo(() => rows.map(enrichProduct), [rows])
  const categories = [...new Set(enrichedRows.map(p => p.category)
    .filter((c): c is string => Boolean(c))
    .filter(c => !/^(pantry|مؤن)$/i.test(c.trim())))]
  const filtered = useMemo(() => enrichedRows.filter(p =>
    (!category || p.category === category) &&
    `${p.title} ${text(p.title)} ${p.category} ${text(p.category ?? '')}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [enrichedRows, category, query, ar])

  async function add(p: Product) {
    if (!monitor.loggedIn) { router.push('/register'); return }
    const nextQty = (cartMap[p.id] ?? 0) + 1
    // Instant optimistic feedback: update badge and show snackbar immediately
    setCartMap(prev => ({ ...prev, [p.id]: nextQty }))
    setNotice(ar ? 'تمت الإضافة إلى السلة' : 'Added to your basket')
    window.dispatchEvent(new CustomEvent('fh-cart-count', { detail: { delta: 1 } }))

    try {
      const sb = supabaseBrowser()
      const { data: { session } } = await sb.auth.getSession()
      if (!session?.user) { router.push('/register'); return }
      const { error } = await sb.from('cart_items').upsert(
        { user_id: session.user.id, product_id: p.id, qty: nextQty },
        { onConflict: 'user_id,product_id' },
      )
      if (error) throw error
    } catch {
      setCartMap(prev => ({ ...prev, [p.id]: Math.max(0, (prev[p.id] ?? 1) - 1) }))
      window.dispatchEvent(new CustomEvent('fh-cart-count', { detail: { delta: -1 } }))
      setNotice(ar ? 'تعذّر تحديث السلة. حاول مرة أخرى.' : 'Could not update your basket. Please try again.')
    }
  }

  return <div className="fh-web fh-production-home" dir={ar ? 'rtl' : 'ltr'} data-no-translate>
    <section className="fh-welcome">
      <div><div className="fh-eyebrow"><Sparkles size={15}/>{ar ? 'رفيق التسوق اليومي' : 'Your everyday food guide'}</div>
        <h1>{ar ? 'اختيارات أهدأ، ومعلومات أوضح.' : 'Better choices. Clearer information.'}</h1>
        <p>{ar ? 'تعرّف على معلومات الملصق وما لفت انتباهنا — ثم اختر ما يناسبك.' : 'Understand the label and what deserves a closer look — then make your choice.'}</p>
      </div>
      <div className="fh-actions">
        <Link href="/scanner" className="fh-button fh-primary"><Barcode size={17}/>{ar ? 'امسح منتجًا' : 'Scan a product'}</Link>
        <Link href="/profile" className="fh-button fh-secondary"><HeartPulse size={17}/>{ar ? 'إعداد الفحص' : 'Screening settings'}</Link>
      </div>
    </section>
    <div className="fh-layout">
      <aside className="fh-aside" id="assistant"><HealthChat lang={lang} profileAvailable={monitor.loggedIn} compact /></aside>
      <section className="fh-maincol" aria-label={ar ? 'المنتجات' : 'Products'}>
        <div className="fh-filterbar">
          <label className="fh-local-search"><span className="sr-only">{ar ? 'ابحث عن منتج' : 'Search products'}</span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={ar ? 'ابحث عن منتج أو عنصر غذائي' : 'Search foods or ingredients'} type="search" />
          </label>
        </div>
        <div className="fh-sectionhead"><div><h2>{ar ? 'اختيارات من السوق' : 'Explore the market'}</h2><p>{ar ? 'افهم سبب الملاحظة قبل أن تقرر.' : 'See what prompted a note, then decide.'}</p></div>
          <span className="fh-count">{filtered.length} {ar ? 'منتج' : 'products'}</span></div>
        <div className="fh-cats">
          <button className={!category ? 'active' : ''} onClick={() => setCategory('')}>{ar ? 'الكل' : 'All'}</button>
          {categories.map(c => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{text(c)}</button>)}
        </div>
        <div className="fh-grid" style={{ marginTop: 12 }}>
          {filtered.map(p => {
            const result = evaluate(p, conditions)
            const flag = result.verdict === 'safe' ? 'good' : result.verdict === 'avoid' ? 'avoid' : 'caution'
            const fitSummary = result.verdict === 'safe'
              ? (monitor.loggedIn
                ? (ar ? 'مناسب لإرشادات ملفك الصحي الحالية' : 'Good fit for your health profile')
                : (ar ? 'لا توجد ملاحظات عامة — سجّل دخولك لتخصيص التقييم لحالتك' : 'No general flags — sign in to personalize for your conditions'))
              : result.verdict === 'avoid'
                ? (ar ? 'غير مناسب لحالتك الصحية الحالية' : 'Not recommended for your current profile')
                : (ar ? 'انتبه لحجم الحصة أو القيم الغذائية' : 'Use caution — check serving size and nutrition')
            const isOpen = expandedProduct === p.id
            return <article className="fh-card fh-product" key={p.id}>
              <Link className="fh-product-visual" href={`/product/${p.id}`} aria-label={text(p.title)}>
                {p.image_url ? <img src={p.image_url} alt={text(p.title)} className="fh-real-product" /> : <Package size={42} aria-hidden="true" />}
              </Link>
              <div className="fh-product-info">
                <CatalogReferenceNotice title={p.title} ar={ar} compact />
                <div className="fh-product-title"><div><h3><Link href={`/product/${p.id}`}>{text(p.title)}</Link></h3><div className="fh-product-detail">{p.serving_size || (ar ? 'راجع حجم الحصة على العبوة' : 'Check the serving size on the pack')} · {text(p.category ?? '')}</div></div>
                  <button type="button" className={`fh-status ${flag}`} aria-expanded={isOpen} aria-controls={`screening-${p.id}`} aria-label={ar ? `تفاصيل ملاحظات ${text(p.title)}` : `Screening details for ${p.title}`} onClick={() => setExpandedProduct(isOpen ? null : p.id)}>{!result.dataComplete ? (ar ? 'بيانات ناقصة' : 'Data missing') : result.verdict === 'safe' ? (ar ? 'مناسب' : 'Suitable') : result.verdict === 'avoid' ? (ar ? 'غير مناسب' : 'Avoid') : (ar ? 'انتبه للحصة' : 'Check serving')}</button>
                </div>
                <button type="button" className="fh-why" style={{ width: '100%', textAlign: 'start', cursor: 'pointer', background: 'transparent', border: 0 }} aria-expanded={isOpen} aria-controls={`screening-${p.id}`} onClick={() => setExpandedProduct(isOpen ? null : p.id)}>
                  <Info size={16} style={{ flexShrink: 0 }} aria-hidden="true" />
                  <span>{fitSummary} · <span className="underline font-semibold">{isOpen ? (ar ? 'إخفاء التفاصيل' : 'Hide details') : (ar ? 'هل يناسبني؟' : 'Check if it fits me')}</span></span>
                </button>
                <div id={`screening-${p.id}`} hidden={!isOpen} role="region" aria-label={ar ? `أسباب ملاحظات ${text(p.title)}` : `Reasons for ${p.title}`} className="fh-expand-panel">
                  <div className={`fh-expand-verdict ${flag}`}>
                    <strong>{fitSummary}</strong>
                  </div>
                  <div className="fh-mini-nutrients">
                    <div><span>{ar ? 'السكر' : 'Sugar'}</span><strong>{nutrition(p.sugar_content, 'g')}</strong></div>
                    <div><span>{ar ? 'صافي الكربوهيدرات' : 'Net Carbs'}</span><strong>{nutrition(p.net_carbs, 'g')}</strong></div>
                    <div><span>{ar ? 'الصوديوم' : 'Sodium'}</span><strong>{nutrition(p.sodium_content, 'mg')}</strong></div>
                    <div><span>{ar ? 'المؤشر السكري' : 'GI'}</span><strong>{nutrition(p.glycemic_index)}</strong></div>
                  </div>
                  <ul className="fh-expand-reasons">{result.reasons.map((reason, index) => <li key={index}>{text(reason)}</li>)}</ul>
                  <Link href={`/product/${p.id}`} className="fh-expand-link">
                    <span>{ar ? 'عرض التحليل الكامل والبدائل الصحية' : 'View full breakdown & healthy swaps'}</span>
                    <ArrowRight size={14} className="rtl:rotate-180" />
                  </Link>
                </div>
                <div className="fh-product-foot"><div className="fh-price">{Number(p.price).toLocaleString(ar ? 'ar-EG' : 'en-EG')} <small>{ar ? 'ج.م' : 'EGP'}</small></div>
                  <button className="fh-add" type="button" onClick={() => add(p)}><ShoppingCart size={13}/>{ar ? 'للسلة' : 'Add'}</button></div>
              </div>
            </article>
          })}
          {!filtered.length && <div className="fh-empty">{rows.length ? (ar ? 'لا توجد منتجات مطابقة. جرّب فئة أو بحثًا آخر.' : 'No matching products. Try another search or category.') : (ar ? 'لا توجد منتجات متاحة حاليًا. لم نعرض بيانات تجريبية بدلًا منها.' : 'No products are currently available. No sample inventory has been substituted.')}</div>}
        </div>
      </section>
    </div>
    {notice && (
      <div className="fh-toast" role="status" aria-live="polite">
        <CheckCircle2 size={17} style={{ flexShrink: 0 }} aria-hidden="true" />
        <span>{notice}</span>
        <button type="button" onClick={() => setNotice('')} aria-label={ar ? 'إغلاق' : 'Dismiss'}>×</button>
      </div>
    )}
  </div>
}
