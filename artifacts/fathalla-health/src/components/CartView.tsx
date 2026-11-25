'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { evaluate, CONDITIONS, type Product } from '@/lib/health'
import { assessCart, intakePercent, type Limits } from '@/lib/cart-status'
import { translate } from '@/lib/i18n-ar'
import { supabaseBrowser } from '@/lib/supabase/client'
import HealthBadge from './HealthBadge'

type CartRow = { qty: number; product: Product }

const COND_AR: Record<string, string> = {
  t2d: 'السكري من النوع الثاني',
  t1d: 'السكري من النوع الأول',
  prediabetes: 'مقدمات السكري',
  hypertension: 'ارتفاع ضغط الدم',
  cardio: 'القلب والكوليسترول',
  lactose: 'حساسية اللاكتوز',
  celiac: 'حساسية الجلوتين',
}

function Bar({ label, value, max, unit, limitText }: { label: string; value: number; max: number; unit: string; limitText: string }) {
  const over = value > max
  const warn = !over && value >= max * 0.7 && value > 0
  return (
    <div className="flex flex-col gap-space-xs">
      <div className="flex justify-between items-baseline">
        <span className="font-body-md text-body-md text-on-surface font-semibold">{label}</span>
        <span className={`font-metric-display text-base font-bold ${over ? 'text-error' : warn ? 'text-primary' : 'text-tertiary'}`}>
          {+value.toFixed(1)}{unit} <span className="text-xs text-secondary font-normal">/ {max}{unit} {limitText}</span>
        </span>
      </div>
      <div className="w-full h-2.5 bg-surface-container-low rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-200 ${over ? 'bg-error' : warn ? 'bg-primary-container' : 'bg-tertiary'}`}
          style={{ width: `${Math.min(100, intakePercent(value, max))}%` }} />
      </div>
    </div>
  )
}

export default function CartView({
  initialItems,
  conditions,
  limits,
  userDisplayName,
  lang,
}: {
  initialItems: CartRow[]
  conditions: string[]
  limits: Limits
  userDisplayName: string
  lang: 'ar' | 'en'
}) {
  const ar = lang === 'ar'
  const tx = (en: string) => (ar ? translate(en) : en)
  const [items, setItems] = useState<CartRow[]>(initialItems)
  const [syncError, setSyncError] = useState('')
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const pendingQtyRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t))
      pendingQtyRef.current.forEach((qty, productId) => {
        const sb = supabaseBrowser()
        void (qty <= 0
          ? sb.from('cart_items').delete().eq('product_id', productId)
          : sb.from('cart_items').update({ qty }).eq('product_id', productId))
      })
      pendingQtyRef.current.clear()
    }
  }, [])

  function emitCount(list: CartRow[]) {
    const count = list.reduce((s, i) => s + i.qty, 0)
    window.dispatchEvent(new CustomEvent('fh-cart-count', { detail: { count } }))
  }

  async function flushQty(productId: string, qty: number, rollback: CartRow[]) {
    const sb = supabaseBrowser()
    const { error } = qty <= 0
      ? await sb.from('cart_items').delete().eq('product_id', productId)
      : await sb.from('cart_items').update({ qty }).eq('product_id', productId)
    if (error) {
      setItems(rollback)
      emitCount(rollback)
      setSyncError(ar ? 'تعذّر حفظ التعديل في السلة. حاول مرة أخرى.' : `Could not update cart: ${error.message}`)
    }
  }

  function updateQty(productId: string, nextQty: number) {
    setSyncError('')
    const previous = items
    const next = nextQty <= 0
      ? items.filter(i => i.product.id !== productId)
      : items.map(i => (i.product.id === productId ? { ...i, qty: nextQty } : i))

    // Instant 0ms UI update
    setItems(next)
    emitCount(next)
    pendingQtyRef.current.set(productId, nextQty)

    // Debounce DB sync so rapid +/- clicks send only one request
    const existingTimer = timersRef.current.get(productId)
    if (existingTimer) clearTimeout(existingTimer)
    const timer = setTimeout(() => {
      timersRef.current.delete(productId)
      const finalQty = pendingQtyRef.current.get(productId)
      pendingQtyRef.current.delete(productId)
      if (finalQty !== undefined) void flushQty(productId, finalQty, previous)
    }, 300)
    timersRef.current.set(productId, timer)
  }

  const a = assessCart(items, conditions, limits)
  const { t, risky } = a
  const totalCount = items.reduce((s, i) => s + i.qty, 0)

  const ST = {
    empty: { soft: 'bg-surface-container-high', text: 'text-on-surface-variant', icon: 'shopping_cart', title: ar ? 'سلتك فارغة' : 'Your cart is empty' },
    safe: { soft: 'bg-tertiary-fixed/30', text: 'text-tertiary', icon: 'shield', title: ar ? 'السلة ضمن حدودك الصحية' : 'Cart is within your limits' },
    caution: { soft: 'bg-primary-fixed/50', text: 'text-primary', icon: 'info', title: ar ? 'راجع الكميات أو البيانات الناقصة' : 'Review portions or missing label data' },
    over: { soft: 'bg-error-container', text: 'text-error', icon: 'warning', title: ar ? 'راجع السلة قبل إتمام الشراء' : 'Review before checkout' },
  }
  const st = ST[a.level]
  const btn = 'w-8 h-8 rounded-lg bg-surface-container-highest hover:bg-surface-dim active:scale-95 flex items-center justify-center transition-transform select-none'

  return (
    <div dir={ar ? 'rtl' : 'ltr'} data-no-translate className="w-full max-w-[1440px] mx-auto px-4 md:px-margin-tablet lg:px-margin-desktop py-space-lg">
      <section className="flex flex-col gap-space-xs mb-space-xl">
        <div className="flex items-center gap-space-xs text-primary font-label-sm uppercase tracking-wider">
          <span className="material-symbols-outlined text-base">clinical_notes</span>
          <span>{ar ? 'متابعة التغذية الذكية' : 'Metabolic Wellness Architecture'}</span>
        </div>
        <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
          {ar ? 'ملفك الصحي وسلة التسوق الذكية' : 'Personalized Health Profile & Interactive Smart Cart'}
        </h1>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
        <section className="lg:col-span-6 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-variant/40 flex items-center gap-space-md">
            <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-headline-md text-headline-md ring-2 ring-tertiary">
              {(userDisplayName || '?')[0].toUpperCase()}
            </div>
            <div className="flex flex-col gap-space-xs">
              <span className="font-title-lg text-title-lg text-on-surface font-bold">{userDisplayName}</span>
              <div className="flex flex-wrap gap-space-xs">
                {conditions.length === 0 && (
                  <span className="font-body-md text-secondary">{ar ? 'لم يتم تحديد حالات صحية' : 'No conditions selected'}</span>
                )}
                {conditions.map(k => (
                  <span key={k} className="px-space-md py-space-xs rounded-full bg-surface-container text-on-surface font-label-md">
                    {ar ? (COND_AR[k] ?? CONDITIONS[k] ?? k) : (CONDITIONS[k] ?? k)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-variant/40 flex flex-col gap-space-lg">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary">tune</span>
              <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                {ar ? 'حدود السلة المستهدفة' : 'Target Intake Safeguards'}
              </h2>
            </div>
            <Bar label={ar ? 'حد السكر' : 'Sugar screening limit'} value={t.sugar} max={limits.sugar} unit="g" limitText={ar ? 'الحد' : 'limit'} />
            <Bar label={ar ? 'حد صافي الكربوهيدرات' : 'Max Net Carbs'} value={t.carbs} max={limits.carbs} unit="g" limitText={ar ? 'الحد' : 'limit'} />
            <Bar label={ar ? 'حد الصوديوم' : 'Sodium screening limit'} value={t.sodium} max={limits.sodium} unit="mg" limitText={ar ? 'الحد' : 'limit'} />
            <p className="text-xs text-on-surface-variant">
              {ar
                ? 'الإجماليات محسوبة لكل حصة × الكمية في السلة، وليست سجل يومك الكامل. الحدود إرشادية وليست وصفة طبية.'
                : 'Cart totals are per item serving × quantity, not a record of your whole day. Limits are screening targets, not medical prescriptions.'}
            </p>
          </div>
        </section>

        <section className="lg:col-span-6 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-variant/40 flex items-center gap-space-md">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${st.soft}`}>
              <span className={`material-symbols-outlined text-3xl ${st.text}`}>{st.icon}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-secondary uppercase tracking-wider font-semibold">
                {ar ? 'فحص السلة الفوري' : 'Real-Time Cart Screening'}
              </span>
              <span className="font-headline-md text-headline-md text-on-surface font-bold">{st.title}</span>
              {a.notes.map((note, idx) => (
                <p key={idx} className="font-body-sm text-body-sm text-on-surface-variant">{tx(note)}</p>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-variant/40 flex flex-col gap-space-md">
            <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
              {ar ? `منتجات السلة (${totalCount})` : `Inspected Cart Items (${totalCount})`}
            </h3>
            {syncError && (
              <p role="alert" className="rounded-lg bg-error-container text-on-error-container px-3 py-2 text-sm font-medium">
                {syncError}
              </p>
            )}
            {items.length === 0 && (
              <p className="font-body-md text-secondary">
                {ar ? 'السلة فارغة. ' : 'Your cart is empty. '}
                <Link href="/" className="text-primary font-semibold">{ar ? 'تصفح السوق' : 'Browse the market'}</Link>
                {ar ? ' أو ' : ' or '}
                <Link href="/scanner" className="text-primary font-semibold">{ar ? 'امسح باركود' : 'scan a barcode'}</Link>.
              </p>
            )}
            {items.map(({ qty, product: p }) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                <Link href={`/product/${p.id}`} className="flex items-center gap-space-md min-w-0">
                  <div className="w-14 h-14 rounded-lg bg-white overflow-hidden shrink-0">
                    {p.image_url && <img className="w-full h-full object-cover" src={p.image_url} alt={tx(p.title)} />}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-title-md text-title-md text-on-surface font-semibold">{tx(p.title)}</span>
                    <div className="flex items-center gap-space-xs">
                      <HealthBadge verdict={evaluate(p, conditions).verdict} lang={lang} />
                      <span className="text-secondary font-label-sm">
                        {Number(p.price).toFixed(2)} {ar ? 'للقطعة' : 'each'}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="flex items-center justify-between sm:justify-end gap-space-md">
                  <div className="flex items-center gap-space-xs">
                    <button type="button" onClick={() => updateQty(p.id, qty - 1)} aria-label={ar ? 'إنقاص الكمية' : 'Decrease quantity'} className={btn}>
                      <span className="material-symbols-outlined text-lg">remove</span>
                    </button>
                    <span className="w-8 text-center font-metric-label text-metric-label font-bold">{qty}</span>
                    <button type="button" onClick={() => updateQty(p.id, qty + 1)} aria-label={ar ? 'زيادة الكمية' : 'Increase quantity'} className={btn}>
                      <span className="material-symbols-outlined text-lg">add</span>
                    </button>
                    <button type="button" onClick={() => updateQty(p.id, 0)} aria-label={ar ? 'حذف المنتج' : 'Remove item'} className="w-8 h-8 rounded-lg hover:bg-error-container text-error flex items-center justify-center ms-space-xs">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                  <span className="font-metric-display text-base text-on-surface font-bold w-24 text-end">
                    {(p.price * qty).toFixed(2)} <span className="text-xs font-normal text-secondary">{ar ? 'ج.م' : 'EGP'}</span>
                  </span>
                </div>
              </div>
            ))}
            {risky.length > 0 && (
              <div className="p-space-md rounded-lg bg-error-container text-on-error-container font-body-md">
                <b>{ar ? 'تنبيه:' : 'Heads up:'}</b> {risky.map(r => tx(r.product.title)).join(', ')}{' '}
                {ar ? 'غير مناسب لملفك الصحي الحالي.' : `${risky.length > 1 ? 'are' : 'is'} not recommended for your profile.`}
              </div>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-variant/40 flex flex-col gap-space-md">
            <div className="flex justify-between items-baseline">
              <span className="font-title-lg text-title-lg text-on-surface font-bold">{ar ? 'الإجمالي' : 'Total'}</span>
              <span className="font-metric-display text-metric-display text-primary font-bold">
                {t.price.toFixed(2)} <span className="text-sm font-normal text-secondary">{ar ? 'ج.م' : 'EGP'}</span>
              </span>
            </div>
            <button className="w-full h-12 bg-primary-container hover:bg-primary text-on-primary font-title-md text-title-md font-bold rounded-lg shadow-md active:scale-[0.98] flex items-center justify-center gap-space-xs" type="button">
              <span>{ar ? 'إتمام الطلب الصحي' : 'Proceed to Secure Health Checkout'}</span>
              <span className="material-symbols-outlined text-xl rtl:-scale-x-100">arrow_forward</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
