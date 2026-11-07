import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import RegistrationIntro from '@/components/RegistrationIntro'
import { cookies } from 'next/headers'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import ConnectionNotice from '@/components/ConnectionNotice'

export default async function Page() {
  const preferences = await cookies()
  const lang = preferences.get('lang')?.value === 'ar' ? 'ar' : 'en'
  const initialSeen = preferences.get('fathalla-tutorial-v1')?.value === 'done'
  if (!isSupabaseConfigured()) return <>
    <ConnectionNotice />
    <RegistrationIntro lang={lang} configured={false} initialSeen={initialSeen} />
  </>
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (user) redirect('/') // already signed in: hide register / login
  return <RegistrationIntro lang={lang} initialSeen={initialSeen} />
}
