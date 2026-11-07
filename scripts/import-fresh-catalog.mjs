// One-off, server-only import. Default is read-only; use --apply to insert.
// Never import this module into application code or expose the admin key there.
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const base = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!base || !key || !anon || key.startsWith('sb_publishable_')) throw Error('A Supabase server credential is required; do not use a publishable key.')
const root = new URL('../', import.meta.url)
const local = p => fileURLToPath(new URL(p, root))
const catalog = JSON.parse(await readFile(local('artifacts/fathalla-health/src/data/catalog-additions.json'), 'utf8'))
const headers = { apikey: key, Authorization: `Bearer ${key}` }
const prefix = 'fresh-catalog-2026-11'
async function api(path, init = {}, publicRead = false) {
  const h = publicRead ? { apikey: anon, Authorization: `Bearer ${anon}` } : headers
  const r = await fetch(`${base}${path}`, { ...init, headers: { ...h, ...init.headers } })
  if (!r.ok) {
    const detail = await r.json().catch(() => ({}))
    const safeMessage = String(detail.message || detail.error || 'Request rejected').replaceAll(key, '[redacted]').slice(0, 400)
    throw Error(`Supabase ${init.method || 'GET'} failed (${r.status}, ${detail.code || 'unknown'}) at ${path.split('?')[0]}: ${safeMessage}`)
  }
  return r
}
async function products(publicRead = false) {
  const r = await api('/rest/v1/products?select=*&order=title&limit=1000', { headers: { Prefer: 'count=exact' } }, publicRead)
  if (Number(r.headers.get('content-range')?.split('/')[1]) > 1000) throw Error('Catalog needs paginated import inspection.')
  return r.json()
}
const before = await products()
const bucket = await (await api('/storage/v1/bucket/product-images')).json()
if (!bucket.public) throw Error('Existing product-images bucket must already be public. No permissions were changed.')
const unique = new Set()
for (const p of catalog.products) {
  if (unique.has(p.slug) || unique.has(p.title.toLowerCase()) || !Number.isFinite(p.price) || p.price <= 0 ||
      !/^https:\/\//.test(p.source) || !/^[a-z-]+$/.test(p.slug)) throw Error('Invalid or duplicate catalog entry')
  unique.add(p.slug); unique.add(p.title.toLowerCase())
}
const missing = catalog.products.filter(p => !before.some(b => b.title.trim().toLowerCase() === p.title.toLowerCase()))
function internalBarcode(p) {
  const base = String(200010000001 + catalog.products.findIndex(entry => entry.slug === p.slug))
  const sum = [...base].reduce((n, d, i) => n + Number(d) * (i % 2 ? 3 : 1), 0)
  return base + ((10 - sum % 10) % 10)
}
for (const p of missing) {
  if (before.some(old => old.barcode === internalBarcode(p))) throw Error('Internal barcode is already assigned; no records were modified.')
}
console.log(JSON.stringify({ existingProducts: before.length, toInsert: missing.length, apply: process.argv.includes('--apply') }))
if (!process.argv.includes('--apply')) process.exit(0)
await writeFile(local('generated-artifacts/catalog-import/products-before.json'), JSON.stringify(before, null, 2))

function stableId(slug) {
  // RFC 4122 UUID v5, URL namespace; also guards against concurrent imports.
  const namespace = Buffer.from('6ba7b8119dad11d180b400c04fd430c8', 'hex')
  const bytes = createHash('sha1').update(namespace).update(`${base}/catalog/${prefix}/${slug}`).digest().subarray(0, 16)
  bytes[6] = (bytes[6] & 15) | 80; bytes[8] = (bytes[8] & 63) | 128
  const h = bytes.toString('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
const rows = []
for (const p of missing) {
  const image = local(`generated-artifacts/catalog-import/${p.slug}.webp`)
  const x = (p.cell % 2) * 512 + 2, y = Math.floor(p.cell / 2) * 512 + 2
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', local(`generated-artifacts/catalog-import/sheet-${p.sheet}.jpg`),
    '-vf', `crop=508:508:${x}:${y},scale=640:640,crop=640:400:0:120`, '-frames:v', '1', '-quality', '85', image])
  const bytes = await readFile(image)
  if (bytes.length < 1000 || bytes.length > 250000) throw Error('Unexpected image size')
  const object = `${prefix}/${p.slug}.webp`
  const url = `${base}/storage/v1/object/public/product-images/${object}`
  const existing = await fetch(url)
  if (existing.ok) {
    const old = Buffer.from(await existing.arrayBuffer())
    if (!old.equals(bytes)) throw Error(`Refusing to overwrite existing image for ${p.slug}`)
  } else {
    await existing.body?.cancel()
    if (existing.status !== 400 && existing.status !== 404) throw Error('Could not inspect image destination')
    const uploaded = await api(`/storage/v1/object/product-images/${object}`, {
      method: 'POST', headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'x-upsert': 'false' }, body: bytes,
    })
    await uploaded.body?.cancel()
  }
  rows.push({
    id: stableId(p.slug), title: p.title, category: p.category, price: p.price,
    image_url: url, serving_size: p.pack,
    barcode: internalBarcode(p), ingredients: null,
    glycemic_index: null, glycemic_load: null, sugar_content: null,
    net_carbs: null, sodium_content: null, trans_fat: null, health_score: null,
    is_gluten_free: null, is_lactose_free: null,
  })
}
// One atomic insert: no updates, deletes, schema changes or policy changes.
if (rows.length) {
  const inserted = await api('/rest/v1/products', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(rows),
  })
  const result = await inserted.json()
  if (result.length !== rows.length) throw Error('Inserted row count mismatch')
}
const after = await products(true)
for (const old of before) {
  if (JSON.stringify(after.find(p => p.id === old.id)) !== JSON.stringify(old)) throw Error('Original product changed during import')
}
for (const p of catalog.products) {
  const matches = after.filter(row => row.title === p.title)
  if (matches.length !== 1 || !matches[0].image_url) throw Error(`Product missing or duplicated: ${p.slug}`)
  const img = await fetch(matches[0].image_url)
  const bytes = Buffer.from(await img.arrayBuffer())
  if (!img.ok || !img.headers.get('content-type')?.startsWith('image/') || bytes.length < 1000) throw Error(`Public image verification failed: ${p.slug}`)
}
const report = { inserted: rows.length, total: after.length, originalProductsUnchanged: true, publicImagesVerified: catalog.products.length }
await writeFile(local('generated-artifacts/catalog-import/result.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report))
