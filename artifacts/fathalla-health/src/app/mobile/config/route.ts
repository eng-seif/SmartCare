import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Only the same public, RLS-scoped credential already shipped to web browsers.
 * Refuse server/service keys if the project was accidentally misconfigured. */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  let publishable = key?.startsWith('sb_publishable_') ?? false
  try {
    if (key?.split('.').length === 3)
      publishable = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'
  } catch { publishable = false }
  if (!url || !key || !publishable) return NextResponse.json(
    { error: 'Mobile connection is not configured.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  )
  return NextResponse.json({ supabaseUrl: url, supabasePublishableKey: key }, {
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  })
}
