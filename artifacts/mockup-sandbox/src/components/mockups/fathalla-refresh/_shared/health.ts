export type Product = {
  id: string; barcode: string | null; title: string; category: string | null
  price: number; image_url: string | null
  glycemic_index: number | null; glycemic_load: number | null; sugar_content: number | null
  net_carbs: number | null; sodium_content: number | null; health_score: number | null
  is_gluten_free: boolean | null; is_lactose_free: boolean | null; sat_fat_g?: number | null; serving_size?: string | null
}
/** Unknown label data is not zero. Use n() only when calculating known subtotals. */
export const known = (v: unknown): v is number =>
  v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0
export const n = (v: number | null | undefined) => known(v) ? Number(v) : 0
export const nutrition = (v: number | null | undefined, unit = '') =>
  known(v) ? `${Number(v)}${unit}` : '—'
export type Verdict = 'safe' | 'caution' | 'avoid'

export const CONDITIONS: Record<string, string> = {
  t2d: 'Type 2 Diabetes', t1d: 'Type 1 Diabetes', prediabetes: 'Prediabetes / Insulin Resistance',
  hypertension: 'Hypertension', cardio: 'Cardiovascular / Cholesterol', lactose: 'Lactose Intolerance', celiac: 'Celiac / Gluten Sensitivity',
}

export function evaluate(p: Product, c: string[] = []) {
  const reasons: string[] = []
  let v = 'safe' as Verdict
  let dataComplete = true
  const rank = { safe: 0, caution: 1, avoid: 2 }
  const up = (to: Verdict, why: string) => {
    reasons.push(why)
    if (rank[to] > rank[v]) v = to
  }
  const missing = (name: string) => {
    dataComplete = false
    up('caution', `Missing label data: ${name}. Check the package before choosing.`)
  }
  for (const [value, label] of [
    [p.sugar_content, 'sugar'], [p.net_carbs, 'net carbs'], [p.sodium_content, 'sodium'],
  ] as const) if (!known(value)) missing(label)

  // Per-serving screening rules, NOT a diagnosis or a prediction of blood glucose.
  // GI: low <=55, medium 56–69, high >=70. GL includes serving size.
  const diabetes = c.some(x => ['t2d', 't1d', 'prediabetes'].includes(x))
  if (diabetes && !known(p.glycemic_index) && !known(p.glycemic_load)) missing('GI or GL')
  if (known(p.glycemic_index)) {
    if (p.glycemic_index >= 70) up(diabetes ? 'avoid' : 'caution', `High glycemic index (${p.glycemic_index})`)
    else if (p.glycemic_index > 55) up('caution', `Moderate glycemic index (${p.glycemic_index})`)
  }
  if (known(p.glycemic_load)) {
    if (p.glycemic_load >= 20) up(diabetes ? 'avoid' : 'caution', `High glycemic load (${p.glycemic_load})`)
    else if (p.glycemic_load > 10) up('caution', `Moderate glycemic load (${p.glycemic_load})`)
  }
  if (known(p.sugar_content) && p.sugar_content > 10)
    up('caution', `Sugar ${p.sugar_content}g per serving; consider portion size.`)
  if (diabetes && known(p.net_carbs) && p.net_carbs > 30)
    up('caution', `Net carbs ${p.net_carbs}g per serving; consider portion size.`)
  if (known(p.sodium_content) && p.sodium_content > 400)
    up(c.includes('hypertension') ? 'avoid' : 'caution', `High sodium (${p.sodium_content}mg)`)
  if (c.includes('cardio')) {
    if (!known(p.sat_fat_g)) missing('saturated fat')
    else if (p.sat_fat_g > 5) up('caution', `Saturated fat ${p.sat_fat_g}g`)
  }
  if (c.includes('lactose')) {
    if (p.is_lactose_free === false) up('avoid', 'Contains lactose')
    else if (p.is_lactose_free !== true) missing('lactose-free status')
  }
  if (c.includes('celiac')) {
    if (p.is_gluten_free === false) up('avoid', 'Contains gluten')
    else if (p.is_gluten_free !== true) missing('gluten-free status')
  }
  if (!reasons.length) reasons.push('No flags under the selected screening rules. Portion size and your clinician’s advice still matter.')
  return { verdict: v, reasons, dataComplete }
}

export const cartTotals = (items: { qty: number; product: Product }[]) => ({
  sugar: items.reduce((s, i) => s + n(i.qty) * n(i.product.sugar_content), 0),
  carbs: items.reduce((s, i) => s + n(i.qty) * n(i.product.net_carbs), 0),
  sodium: items.reduce((s, i) => s + n(i.qty) * n(i.product.sodium_content), 0),
  price: items.reduce((s, i) => s + n(i.qty) * n(i.product.price), 0),
})
