import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer, type Server } from 'node:http'
import { quotaTestDb } from '../../../lib/db/tests/quota-test-db'

let db: Awaited<ReturnType<typeof quotaTestDb>>
let pool: (typeof import('@workspace/db'))['pool']
let server: Server
let providerCalls = 0
let providerFails = false
let POST: (request: Request) => Promise<Response>
const request = (lang = 'en', extra = {}) => new Request('http://localhost/assistant/chat', {
  method: 'POST', headers: { host: 'localhost', 'content-type': 'application/json' },
  body: JSON.stringify({ messages: [{ role: 'user', content: 'What is fiber?' }], lang, useProfile: false, ...extra }),
})

before(async () => {
  // Match the handler's dynamic import: tsx can load static CJS and dynamic ESM
  // imports as separate instances, and each instance would own its own pool.
  ;({ pool } = await import('@workspace/db'))
  db = await quotaTestDb(pool)
  server = createServer(async (req, res) => {
    for await (const _chunk of req) { /* discard synthetic fixture prompt */ }
    providerCalls++
    res.writeHead(providerFails ? 500 : 200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(providerFails ? { error: { message: 'fixture failure' } } : {
      id: 'fixture', choices: [{ message: { role: 'assistant', content: 'Fiber is part of plant foods.' } }],
    }))
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = `http://127.0.0.1:${address.port}/v1`
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY = 'test-only-fixture'
  process.env.SESSION_SECRET = 'test-only-secret-with-at-least-32-characters'
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  delete process.env.CHAT_TRUST_PROXY
  process.env.CHAT_GUEST_DAILY_LIMIT = '2'
  process.env.CHAT_PROJECT_DAILY_LIMIT = '3'
  process.env.CHAT_PROJECT_DAILY_TOKEN_LIMIT = '1000000'
  ;({ POST } = await import('../src/app/assistant/chat/route'))
})

after(async () => {
  if (server) await new Promise<void>(resolve => server.close(() => resolve()))
  if (db) await db.close()
})

// Ordered checks share the handler's burst throttle and isolated database.
test('HTTP handler rejects invalid requests and unconnected profile consent before billing', async () => {
  assert.equal((await POST(request('en', { messages: [] }))).status, 400)
  const crossOrigin = request()
  crossOrigin.headers.set('origin', 'https://other.example')
  assert.equal((await POST(crossOrigin)).status, 403)
  assert.equal((await POST(request('ar', { useProfile: true }))).status, 409)
  assert.equal(providerCalls, 0)
  assert.equal((await pool.query('SELECT * FROM chat_usage')).rows.length, 0)
})

test('guests get replies; quota rejection includes localized messages and retry/reset metadata, no provider call', async () => {
  assert.equal((await POST(request())).status, 200)
  assert.equal((await POST(request('ar'))).status, 200)
  assert.equal(providerCalls, 2)
  for (const lang of ['ar', 'en']) {
    const req = request(lang)
    req.headers.set('x-forwarded-for', '9.8.7.6')
    req.headers.set('cookie', 'new-session=1')
    const response = await POST(req)
    assert.equal(response.status, 429)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.ok(Number(response.headers.get('retry-after')) > 0)
    const body = await response.json()
    assert.equal(body.code, 'CHAT_DAILY_LIMIT')
    assert.match(body.resetAt, /T00:00:00.000Z$/)
    assert.match(body.error, lang === 'ar' ? /اليومي/ : /daily chat allowance/)
  }
  assert.equal(providerCalls, 2)
})

test('provider failures remain charged and project budget blocks before another AI call', async () => {
  process.env.CHAT_GUEST_DAILY_LIMIT = '10'
  providerFails = true
  assert.equal((await POST(request())).status, 503)
  assert.equal(providerCalls, 3)
  const response = await POST(request('ar'))
  assert.equal(response.status, 429)
  assert.equal((await response.json()).code, 'CHAT_PROJECT_LIMIT')
  assert.equal(providerCalls, 3)
  const { rows: [row] } = await pool.query("SELECT requests FROM chat_usage WHERE subject = 'project'")
  assert.equal(row.requests, 3)
})

test('storage failure returns safe 503 without calling AI or disclosing internal details', async () => {
  await pool.query('DROP TABLE chat_usage')
  const response = await POST(request('ar'))
  assert.equal(response.status, 503)
  const body = await response.json()
  assert.equal(body.code, 'CHAT_UNAVAILABLE')
  assert.ok(!body.error.includes('chat_usage'))
  assert.equal(providerCalls, 3)
})

test('missing or malformed quota settings fail closed in either language', async () => {
  delete process.env.SESSION_SECRET
  const missing = await POST(request('en'))
  assert.equal(missing.status, 503)
  assert.equal((await missing.json()).code, 'CHAT_UNAVAILABLE')
  process.env.SESSION_SECRET = 'test-only-secret-with-at-least-32-characters'
  process.env.CHAT_PROJECT_DAILY_LIMIT = '0'
  const invalid = await POST(request('ar'))
  assert.equal(invalid.status, 503)
  assert.equal((await invalid.json()).code, 'CHAT_UNAVAILABLE')
  assert.equal(providerCalls, 3)
})
