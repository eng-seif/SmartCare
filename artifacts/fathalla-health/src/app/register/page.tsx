import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import RegisterForm from '@/components/RegisterForm'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import ConnectionNotice from '@/components/ConnectionNotice'

export default async function Page() {
  if (!isSupabaseConfigured()) return <>
    <ConnectionNotice />
    <fieldset disabled className="min-w-0"><RegisterForm /></fieldset>
  </>
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (user) redirect('/') // already signed in: hide register / login
  return <RegisterForm />
}
