import { test } from 'node:test'
import assert from 'node:assert/strict'
import catalog from '../src/data/catalog-additions.json'
import { translate } from '../src/lib/i18n-ar'
import { evaluate, type Product } from '../src/lib/health'

test('Fresh catalog has twenty distinct products, photos, Arabic names and traceable reference prices', () => {
  assert.equal(catalog.products.length, 20)
  assert.equal(new Set(catalog.products.map(p => p.slug)).size, 20)
  assert.equal(new Set(catalog.products.map(p => `${p.sheet}/${p.cell}`)).size, 20)
  for (const category of ['Fruits', 'Vegetables']) assert.equal(catalog.products.filter(p => p.category === category).length, 10)
  for (const p of catalog.products) {
    assert.equal(translate(p.title), p.ar)
    assert.ok(p.price > 0 && Number.isFinite(p.price))
    assert.ok(['www.carrefouregypt.com', 'ripe-eg.com'].includes(new URL(p.source).hostname))
  }
})

test('Fresh food without verified nutrition is not classified as safe or as zero', () => {
  const p: Product = {
    id: 'test', title: 'Fresh Tomatoes (500 g)', price: 16.25, category: 'Vegetables',
    barcode: null, image_url: null, glycemic_index: null, glycemic_load: null,
    sugar_content: null, net_carbs: null, sodium_content: null, health_score: null,
    is_gluten_free: null, is_lactose_free: null,
  }
  for (const conditions of [[], ['t2d'], ['hypertension'], ['celiac'], ['lactose']]) {
    assert.equal(evaluate(p, conditions).verdict, 'caution')
    assert.ok(evaluate(p, conditions).reasons.some(r => r.includes('Missing label data')))
  }
})
