import pg from 'pg'

let sequence = 0
// Integration tests use an isolated schema copied from the applied Drizzle
// schema, never the application's counters. No real AI calls are needed.
export async function quotaTestDb(existingPool?: pg.Pool) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for quota integration tests')
  const schema = `quota_test_${process.pid}_${++sequence}`
  const admin = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 })
  await admin.query(`CREATE SCHEMA ${schema}`)
  try {
    await admin.query(`CREATE TABLE ${schema}.chat_usage (LIKE public.chat_usage INCLUDING ALL)`)
    const pool = existingPool ?? new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
    })
    pool.options.options = `-c search_path=${schema}`
    return {
      pool,
      newPool: () => new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        options: `-c search_path=${schema}`,
        connectionTimeoutMillis: 5000,
      }),
      async close() {
        await pool.end()
        await admin.query(`DROP SCHEMA ${schema} CASCADE`)
        await admin.end()
      },
    }
  } catch (error) {
    await admin.query(`DROP SCHEMA ${schema} CASCADE`)
    await admin.end()
    throw error
  }
}
