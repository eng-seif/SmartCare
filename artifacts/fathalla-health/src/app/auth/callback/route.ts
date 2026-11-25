import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'signup' | 'recovery' | 'invite' | 'email' | null
  const rawNext = searchParams.get('next') ?? '/cart'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/cart'

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/register`)
  }

  const sb = await supabaseServer()
  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  } else if (tokenHash && type) {
    const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/register?error=auth_callback`)
}
