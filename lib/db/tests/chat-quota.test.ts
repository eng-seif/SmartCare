import assert from 'node:assert/strict'
import { test } from 'node:test'
import { reserveChatUsage } from '../src/chat-quota'
import { quotaTestDb } from './quota-test-db'

const subject = (n: number, user = false) => `${user ? 'user' : 'guest'}:${n.toString(16).padStart(64, '0')}`
const input = (n = 1) => ({
  subject: subject(n), personalLimit: 5, projectLimit: 100, projectTokenLimit: 10000, tokens: 100,
})

test('personal limit is exact under concurrency; denied requests do not consume project budget', async () => {
  const db = await quotaTestDb()
  try {
    const results = await Promise.all(Array.from({ length: 20 }, () => reserveChatUsage(db.pool, input())))
    assert.equal(results.filter(r => r.allowed).length, 5)
    assert.ok(results.filter(r => !r.allowed).every(r => r.scope === 'personal'))
    const { rows } = await db.pool.query('SELECT requests, reserved_tokens FROM chat_usage')
    assert.equal(rows.length, 2)
    assert.ok(rows.every(row => row.requests === 5 && row.reserved_tokens === 500))
  } finally { await db.close() }
})

test('global request ceiling is atomic across distinct instances and subjects', async () => {
  const db = await quotaTestDb()
  const other = db.newPool()
  try {
    const results = await Promise.all(Array.from({ length: 30 }, (_, n) =>
      reserveChatUsage(n % 2 ? db.pool : other, { ...input(n + 1), projectLimit: 7 })))
    assert.equal(results.filter(r => r.allowed).length, 7)
    assert.ok(results.filter(r => !r.allowed).every(r => r.scope === 'project'))
  } finally { await other.end(); await db.close() }
})

test('global reserved-token ceiling is exact and oversized reservations do not charge anyone', async () => {
  const db = await quotaTestDb()
  try {
    assert.equal((await reserveChatUsage(db.pool, { ...input(), tokens: 10001 })).allowed, false)
    const results = await Promise.all(Array.from({ length: 20 }, (_, n) =>
      reserveChatUsage(db.pool, { ...input(n + 1), projectTokenLimit: 350 })))
    assert.equal(results.filter(r => r.allowed).length, 3)
    const { rows: [row] } = await db.pool.query("SELECT * FROM chat_usage WHERE subject = 'project'")
    assert.equal(row.reserved_tokens, 300)
    assert.equal(row.requests, 3)
  } finally { await db.close() }
})

test('new connection pools retain counters; accounts and guests remain separate', async () => {
  const db = await quotaTestDb()
  let other = db.newPool()
  try {
    assert.equal((await reserveChatUsage(other, { ...input(), personalLimit: 1 })).allowed, true)
    await other.end()
    other = db.newPool()
    assert.equal((await reserveChatUsage(other, { ...input(), personalLimit: 1 })).allowed, false)
    assert.equal((await reserveChatUsage(other, { ...input(), subject: subject(1, true), personalLimit: 2 })).allowed, true)
    assert.equal((await reserveChatUsage(other, { ...input(), subject: subject(1, true), personalLimit: 2 })).allowed, true)
    assert.equal((await reserveChatUsage(other, { ...input(), subject: subject(1, true), personalLimit: 2 })).allowed, false)
  } finally { await other.end(); await db.close() }
})

test('previous-day quotas do not block today; reset is next midnight UTC and old counters expire', async () => {
  const db = await quotaTestDb()
  try {
    await db.pool.query(`INSERT INTO chat_usage (day, subject, requests, reserved_tokens) VALUES
      ((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date - 1, 'project', 100, 10000),
      ((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date - 1, $1, 5, 500),
      ((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date - 8, $1, 1, 100)`, [subject(1)])
    const result = await reserveChatUsage(db.pool, input())
    assert.equal(result.allowed, true)
    assert.match(result.resetAt, /T00:00:00.000Z$/)
    assert.ok(Date.parse(result.resetAt) > Date.now())
    assert.ok(Date.parse(result.resetAt) - Date.now() <= 86_400_000)
    const { rows: [row] } = await db.pool.query("SELECT count(*)::int AS count FROM chat_usage")
    assert.equal(row.count, 4)
  } finally { await db.close() }
})

test('write errors roll back both counters and missing storage never grants allowance', async () => {
  const db = await quotaTestDb()
  try {
    await db.pool.query('ALTER TABLE chat_usage ADD CONSTRAINT reject_test_subject CHECK (requests < 1)')
    await assert.rejects(reserveChatUsage(db.pool, input()))
    assert.equal((await db.pool.query('SELECT * FROM chat_usage')).rows.length, 0)
    await db.pool.query('DROP TABLE chat_usage')
    await assert.rejects(reserveChatUsage(db.pool, input()))
  } finally { await db.close() }
})

test('reservation input cannot select arbitrary subjects or invalid budgets', async () => {
  const db = await quotaTestDb()
  try {
    for (const patch of [{ subject: 'project' }, { tokens: -1 }, { tokens: 0 }, { personalLimit: NaN }]) {
      await assert.rejects(reserveChatUsage(db.pool, { ...input(), ...patch }))
    }
    assert.equal((await db.pool.query('SELECT * FROM chat_usage')).rows.length, 0)
  } finally { await db.close() }
})
