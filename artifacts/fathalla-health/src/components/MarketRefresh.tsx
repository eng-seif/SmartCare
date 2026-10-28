'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Barcode, HeartPulse, Info, Package, ShoppingCart, Sparkles } from 'lucide-react'
import { evaluate, type Product } from '@/lib/health'
import { translate } from '@/lib/i18n-ar'
import { supabaseBrowser } from '@/lib/supabase/client'
import HealthChat from './HealthChat'

type Props = {
  lang: 'ar' | 'en'; rows: Product[]; conditions: string[]
  monitor: { loggedIn: boolean; [key: string]: unknown }; initialQuery?: string
}

/** Approved visual treatment, backed by the original catalog, auth and screening rules. */
export default function MarketRefresh({ lang, rows, conditions, monitor, initialQuery = '' }: Props) {
  const ar = lang === 'ar'
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState('')
  const [screening, setScreening] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const text = (en: string) => ar ? translate(en) : en
  const categories = [...new Set(rows.map(p => p.category)
    .filter((c): c is string => Boolean(c))
    .filter(c => !/^(pantry|مؤن)$/i.test(c.trim())))]
  const filtered = useMemo(() => rows.filter(p =>
    (!category || p.category === category) &&
    `${p.title} ${text(p.title)} ${p.category} ${text(p.category ?? '')}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (!screening || evaluate(p, conditions).verdict === 'safe')
  ), [rows, category, query, screening, conditions, ar])

  async function add(p: Product) {
    if (!monitor.loggedIn) { router.push('/register'); return }
    setBusy(p.id); setNotice('')
    try {
      const sb = supabaseBrowser()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/register'); return }
      const { data, error: readError } = await sb.from('cart_items').select('qty')
        .eq('user_id', user.id).eq('product_id', p.id).maybeSingle()
      if (readError) throw readError
      const { error } = await sb.from('cart_items').upsert(
        { user_id: user.id, product_id: p.id, qty: (data?.qty ?? 0) + 1 },
        { onConflict: 'user_id,product_id' },
      )
      if (error) throw error
      setNotice(ar ? 'تمت الإضافة إلى السلة.' : 'Added to your basket.')
      router.refresh()
    } catch {
      setNotice(ar ? 'تعذّر تحديث السلة. حاول مرة أخرى.' : 'Could not update your basket. Please try again.')
    } finally { setBusy(null) }
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
          <button className="fh-switch-label" onClick={() => setScreening(!screening)} role="switch" aria-checked={screening}>
            <span>{ar ? 'اعرض الخيارات الأقل تأثيرًا' : 'Show lower-flag choices'}</span><span className={`fh-switch ${screening ? 'on' : ''}`}><i/></span>
          </button>
          <div className="fh-filter-note"><Info size={13}/>{ar ? 'ملاحظاتنا إرشادية وتعتمد على البيانات المتاحة. لا تظهر القيمة المجهولة كأنها صفر.' : 'Screening is guidance based on available labels. Unknown data is never treated as zero.'}</div>
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
            return <article className="fh-card fh-product" key={p.id}>
              <Link className="fh-product-visual" href={`/product/${p.id}`} aria-label={text(p.title)}>
                {p.image_url ? <img src={p.image_url} alt={text(p.title)} className="fh-real-product" /> : <Package size={42} aria-hidden="true" />}
              </Link>
              <div className="fh-product-info">
                <div className="fh-product-title"><div><h3><Link href={`/product/${p.id}`}>{text(p.title)}</Link></h3><div className="fh-product-detail">{p.serving_size || (ar ? 'راجع حجم الحصة على العبوة' : 'Check the serving size on the pack')} · {text(p.category ?? '')}</div></div>
                  <span className={`fh-status ${flag}`}>{!result.dataComplete ? (ar ? 'بيانات ناقصة' : 'Data missing') : result.verdict === 'safe' ? (ar ? 'لا ملاحظات' : 'No flags') : result.verdict === 'avoid' ? (ar ? 'راجع الاختيار' : 'Review choice') : (ar ? 'انتبه للحصة' : 'Check serving')}</span>
                </div>
                <div className="fh-why"><Info size={13}/><span>{text(result.reasons[0])}</span></div>
                <div className="fh-product-foot"><div className="fh-price">{Number(p.price).toLocaleString(ar ? 'ar-EG' : 'en-EG')} <small>{ar ? 'ج.م' : 'EGP'}</small></div>
                  <button className="fh-add" disabled={busy !== null} onClick={() => add(p)}><ShoppingCart size={13}/>{busy === p.id ? '…' : ar ? 'للسلة' : 'Add'}</button></div>
              </div>
            </article>
          })}
          {!filtered.length && <div className="fh-empty">{rows.length ? (ar ? 'لا توجد منتجات مطابقة. جرّب فئة أو بحثًا آخر.' : 'No matching products. Try another search or category.') : (ar ? 'لا توجد منتجات متاحة حاليًا. لم نعرض بيانات تجريبية بدلًا منها.' : 'No products are currently available. No sample inventory has been substituted.')}</div>}
        </div>
      </section>
    </div>
    {notice && <div className="fh-toast" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label={ar ? 'إغلاق' : 'Dismiss'}>×</button></div>}
  </div>
}
