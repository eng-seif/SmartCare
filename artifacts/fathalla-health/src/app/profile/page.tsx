import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import ProfileForm from '@/components/ProfileForm'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import ConnectionNotice from '@/components/ConnectionNotice'

export default async function ProfilePage() {
  if (!isSupabaseConfigured()) return <ConnectionNotice />
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/register')
  const { data: p } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return (
    <ProfileForm userId={user.id} email={user.email ?? ''} initial={{
      full_name: p?.full_name ?? '', age: p?.age ?? '', gender: p?.gender ?? 'male', conditions: p?.conditions ?? [],
      max_sugar_g: p?.max_sugar_g ?? 15, max_carbs_g: p?.max_carbs_g ?? 50, max_sodium_mg: p?.max_sodium_mg ?? 1500,
    }} />
  )
}
