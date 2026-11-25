import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ fallback: true }, { status: 200 })
  }

  let body: {
    email?: unknown
    password?: unknown
    full_name?: unknown
    age?: unknown
    gender?: unknown
    conditions?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || password.length < 6) {
    return NextResponse.json({ error: 'Valid email and password (min 6 chars) are required.' }, { status: 400 })
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : ''
  const age = typeof body.age === 'number' && Number.isFinite(body.age) ? body.age : null
  const gender = typeof body.gender === 'string' ? body.gender : 'male'
  const conditions = Array.isArray(body.conditions)
    ? body.conditions.filter((c): c is string => typeof c === 'string')
    : []

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, age, gender, conditions },
  })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (data.user) {
    await admin.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      age,
      gender,
      conditions,
    })
  }

  return NextResponse.json({ created: true })
}
