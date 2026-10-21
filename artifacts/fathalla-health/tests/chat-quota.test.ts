import assert from 'node:assert/strict'
import { test } from 'node:test'
import { quotaConfig, quotaSubject, reservedTokens, limitMessage, MAX_COMPLETION_TOKENS } from '../src/lib/chat-quota'

const env = { SESSION_SECRET: 'test-only-secret-with-at-least-32-characters' }
const config = quotaConfig(env)

test('safe defaults and strict operator settings', () => {
  assert.equal(config.guest, 5)
  assert.equal(config.user, 20)
  assert.equal(config.project, 100)
  assert.equal(config.tokens, 1_000_000)
  assert.throws(() => quotaConfig({}))
  assert.throws(() => quotaConfig({ SESSION_SECRET: 'short' }))
  for (const value of ['', '0', '-1', '1.5', '1e6', 'Infinity', '2000000001']) {
    assert.throws(() => quotaConfig({ ...env, CHAT_PROJECT_DAILY_LIMIT: value }))
  }
  assert.equal(quotaConfig({ ...env, CHAT_USER_DAILY_LIMIT: '7' }).user, 7)
})

test('verified users have stable, separate pseudonymous buckets without profile sharing', () => {
  const headers = new Headers()
  const a = quotaSubject(config, headers, 'account-one')
  assert.match(a, /^user:[a-f0-9]{64}$/)
  assert.ok(!a.includes('account-one'))
  assert.equal(a, quotaSubject(config, new Headers({ cookie: 'different', 'x-forwarded-for': '1.2.3.4' }), 'account-one'))
  assert.notEqual(a, quotaSubject(config, headers, 'account-two'))
  assert.notEqual(a, quotaSubject(config, headers))
})

test('untrusted client headers, cookies and missing addresses cannot mint guest allowances', () => {
  const guest = quotaSubject(config, new Headers())
  assert.equal(guest, quotaSubject(config, new Headers({ 'x-forwarded-for': '1.2.3.4', cookie: 'new-session' })))
  assert.equal(guest, quotaSubject(config, new Headers({ 'x-real-ip': '8.8.8.8' })))
})

test('explicitly trusted proxy can partition guest networks and rejects invalid addresses', () => {
  const trusted = { ...config, trustProxy: true }
  assert.notEqual(quotaSubject(trusted, new Headers({ 'x-forwarded-for': '1.2.3.4' })),
    quotaSubject(trusted, new Headers({ 'x-forwarded-for': '2.3.4.5' })))
  assert.equal(quotaSubject(trusted, new Headers({ 'x-forwarded-for': 'not-an-ip' })),
    quotaSubject(trusted, new Headers()))
})

test('token reservation includes all context, UTF-8 content and maximum completion', () => {
  const messages = [{ role: 'system', content: 'context' }, { role: 'user', content: 'سؤال' }]
  assert.equal(reservedTokens(messages), Buffer.byteLength(JSON.stringify(messages)) + 1024 + MAX_COMPLETION_TOKENS)
})

test('personal and project limits have distinct Arabic and English messages with reset timezone', () => {
  for (const lang of ['ar', 'en'] as const) {
    assert.notEqual(limitMessage(lang, 'personal'), limitMessage(lang, 'project'))
    for (const scope of ['personal', 'project'] as const) assert.ok(limitMessage(lang, scope).includes('UTC'))
  }
  assert.match(limitMessage('ar', 'personal'), /اليومي/)
  assert.match(limitMessage('en', 'project'), /project budget/)
})
