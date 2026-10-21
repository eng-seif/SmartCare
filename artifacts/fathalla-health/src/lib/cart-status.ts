import { evaluate, cartTotals, known, type Product } from './health'

export type Level = 'empty' | 'safe' | 'caution' | 'over'
export type Limits = { sugar: number; carbs: number; sodium: number }
export const normalizeLimits = (lim: Limits): Limits => ({
  sugar: known(lim.sugar) ? Number(lim.sugar) : 15,
  carbs: known(lim.carbs) ? Number(lim.carbs) : 50,
  sodium: known(lim.sodium) ? Number(lim.sodium) : 1500,
})
export const intakePercent = (value: number, max: number) =>
  max === 0 ? value > 0 ? 101 : 0 : value / max * 100

// One place that decides the cart status, used by BOTH the home monitor and the cart page.
export function assessCart(items: { qty: number; product: Product }[], conditions: string[], lim: Limits) {
  items = items.filter(i => known(i.qty) && i.qty > 0)
  lim = normalizeLimits(lim)
  const t = cartTotals(items)
  const pct = {
    sugar: intakePercent(t.sugar, lim.sugar),
    carbs: intakePercent(t.carbs, lim.carbs),
    sodium: intakePercent(t.sodium, lim.sodium),
  }
  const incomplete = items.filter(i => !evaluate(i.product, conditions).dataComplete)
  const verdicts = items.map(i => evaluate(i.product, conditions).verdict)
  const risky = items.filter((_, k) => verdicts[k] === 'avoid')
  const worst = Math.max(pct.sugar, pct.carbs, pct.sodium)
  const over: string[] = []
  if (pct.sugar > 100) over.push(`Sugar ${+t.sugar.toFixed(1)}g / ${lim.sugar}g`)
  if (pct.carbs > 100) over.push(`Net carbs ${+t.carbs.toFixed(0)}g / ${lim.carbs}g`)
  if (pct.sodium > 100) over.push(`Sodium ${Math.round(t.sodium)}mg / ${lim.sodium}mg`)
  const level: Level = items.length === 0 ? 'empty'
    : risky.length > 0 || worst > 100 ? 'over'
    : worst >= 70 || verdicts.includes('caution') ? 'caution' : 'safe'
  const notes = [
    ...over,
    ...risky.map(i => `${i.product.title}: ${evaluate(i.product, conditions).reasons.join(' ')}`),
    ...(incomplete.length ? ['Some label data is missing. Totals are known subtotals, not complete intake.'] : []),
    ...(level === 'caution' && !incomplete.length && !over.length ? ['Review portions and product screening notes before choosing.'] : []),
  ]
  return { t, pct, risky, over, level, incomplete, notes, limits: lim }
}
