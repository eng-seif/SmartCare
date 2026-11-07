import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ChatContextError, loadChatContext } from '../src/lib/chat-context'
import { chatInstructions, type ChatInput } from '../src/lib/chat-policy'
import type { Product } from '../src/lib/health'

const input: ChatInput = { messages: [{ role: 'user', content: 'قارن actual milk' }], lang: 'ar', useProfile: false }

test('native bearer identity is verified with Supabase, not trusted from a client identifier', async () => {
  const f = fixture()
  let received: string | undefined
  f.client.auth.getUser = (async (token?: string) => {
    received = token
    return { data: { user: { id: 'verified-native-user' } }, error: null }
  }) as typeof f.client.auth.getUser
  const result = await loadChatContext(f.client, input, 'test-bearer')
  assert.equal(received, 'test-bearer')
  assert.equal(result.userId, 'verified-native-user')
  assert.equal(result.context.profileShared, false)
  assert.ok(!f.reads.some(r => r.table === 'profiles'))
})

test('invalid native bearer cannot silently downgrade into an anonymous quota', async () => {
  const f = fixture()
  f.client.auth.getUser = (async () => ({
    data: { user: null }, error: { name: 'AuthApiError', message: 'invalid' },
  })) as typeof f.client.auth.getUser
  await assert.rejects(() => loadChatContext(f.client, input, 'invalid-bearer'),
    (e: unknown) => e instanceof ChatContextError && e.status === 401)
  assert.equal(f.reads.length, 0)
})
const product: Product = {
  id: 'fixture', title: 'Actual milk', category: 'Dairy', barcode: null, price: 40, image_url: null,
  glycemic_index: null, glycemic_load: null, sugar_content: null, net_carbs: 12, sodium_content: 0,
  health_score: null, is_gluten_free: null, is_lactose_free: null,
}
function fixture(options: {
  user?: boolean; authError?: boolean; profile?: object | null; profileError?: boolean
  catalogError?: boolean; catalogThrows?: boolean; products?: Product[]
} = {}) {
  const reads: { table: string; columns?: string; filter?: unknown[] }[] = []
  const client = {
    auth: { getUser: async () => ({
      data: { user: options.user ? { id: 'verified-fixture-user' } : null },
      error: options.authError ? { name: 'AuthRetryableFetchError' } : null,
    }) },
    from(table: string) {
      const read: (typeof reads)[number] = { table }; reads.push(read)
      const query = {
        select(columns: string) { read.columns = columns; return query },
        eq(...filter: unknown[]) { read.filter = filter; return query },
        order(column: string) { assert.equal(column, 'title'); return query },
        async limit(n: number) {
          assert.equal(n, 80)
          if (options.catalogThrows) throw new Error('transport failure')
          return { data: options.products ?? [product], error: options.catalogError ? {} : null }
        },
        async maybeSingle() { return { data: options.profile ?? null, error: options.profileError ? {} : null } },
      }
      return query
    },
  } as unknown as SupabaseClient
  return { client, reads }
}

test('signed-in identity without opt-in never queries or includes the health profile', async () => {
  const f = fixture({ user: true, profile: { conditions: ['t2d'] } })
  const { userId, context } = await loadChatContext(f.client, input)
  assert.equal(userId, 'verified-fixture-user')
  assert.deepEqual(f.reads.map(r => r.table), ['products'])
  assert.equal(context.profileShared, false)
  assert.deepEqual(context.conditions, [])
  assert.equal(context.limits, null)
  assert.ok(!JSON.stringify(context).includes(userId!))
})

test('explicit opt-in reads only the verified account and minimum profile fields', async () => {
  const f = fixture({ user: true, profile: { conditions: ['t2d'], max_sugar_g: 0, max_carbs_g: 30, max_sodium_mg: null } })
  const { context } = await loadChatContext(f.client, { ...input, useProfile: true })
  assert.deepEqual(f.reads[0], { table: 'profiles', columns: 'conditions,max_sugar_g,max_carbs_g,max_sodium_mg', filter: ['id', 'verified-fixture-user'] })
  assert.equal(context.profileShared, true)
  assert.deepEqual(context.conditions, ['t2d'])
  assert.deepEqual(context.limits, { sugar: 0, carbs: 30, sodium: null })
})

test('anonymous consent, missing profile, profile errors and failed auth cannot leak context', async () => {
  const anon = fixture()
  await assert.rejects(loadChatContext(anon.client, { ...input, useProfile: true }), (e: unknown) => e instanceof ChatContextError && e.status === 401 && /سجّل الدخول/.test(e.message))
  assert.equal(anon.reads.length, 0)
  const missing = fixture({ user: true })
  await assert.rejects(loadChatContext(missing.client, { ...input, useProfile: true }), (e: unknown) => e instanceof ChatContextError && e.status === 409)
  const broken = fixture({ user: true, profileError: true })
  await assert.rejects(loadChatContext(broken.client, { ...input, useProfile: true }), /profile-unavailable/)
  const auth = fixture({ authError: true })
  await assert.rejects(loadChatContext(auth.client, input), /auth-unavailable/)
  assert.equal(auth.reads.length, 0)
})

test('actual catalog titles and label values survive; unknown nutrition is never converted to zero', async () => {
  const { context } = await loadChatContext(fixture().client, input)
  assert.equal(context.catalogAvailable, true)
  assert.equal(context.catalog.length, 1)
  const p = context.catalog[0]
  assert.equal(p.title, product.title)
  assert.equal(p.sugar_g, null)
  assert.equal(p.sodium_mg, 0)
  assert.equal(p.serving, null)
  assert.equal(p.saturatedFat_g, null)
  assert.equal(p.screening.dataComplete, false)
  assert.equal(p.screening.verdict, 'caution')
  const policy = chatInstructions('ar', context)
  assert.match(policy, /Egyptian Arabic/)
  assert.match(policy, /Only recommend named products/)
  assert.match(policy, /NEVER zero/)
  assert.match(policy, /only the final text, not audio/)
  assert.match(policy, /NUTRITION_EDUCATION/)
  assert.match(policy, /whole grains/)
  assert.match(policy, /not a live web search/)
})

test('missing config, catalog errors and transport failure preserve general chat without invented inventory', async () => {
  for (const sb of [null, fixture({ catalogError: true }).client, fixture({ catalogThrows: true }).client]) {
    const { context } = await loadChatContext(sb, input)
    assert.equal(context.catalogAvailable, false)
    assert.deepEqual(context.catalog, [])
    assert.match(chatInstructions('ar', context), /never invent inventory/)
  }
  await assert.rejects(loadChatContext(null, { ...input, useProfile: true }), (e: unknown) => e instanceof ChatContextError && e.status === 409)
  const empty = await loadChatContext(fixture({ products: [] }).client, input)
  assert.deepEqual(empty.context.catalog, [])
  assert.equal(empty.context.catalogAvailable, true)
})
