import Scanner from '@/components/Scanner'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import ConnectionNotice from '@/components/ConnectionNotice'
export default function Page() {
  if (!isSupabaseConfigured()) return <ConnectionNotice />
  return <Scanner />
}
