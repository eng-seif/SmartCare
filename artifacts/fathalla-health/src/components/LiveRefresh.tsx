'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

// Syncs profile updates in real time without triggering redundant refreshes on local cart clicks.
export default function LiveRefresh({ userId }: { userId: string }) {
  const router = useRouter()
  useEffect(() => {
    const sb = supabaseBrowser()
    let timer: ReturnType<typeof setTimeout>
    const refresh = () => { clearTimeout(timer); timer = setTimeout(() => router.refresh(), 300) }
    const channel = sb.channel(`live-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, refresh)
      .subscribe()
    return () => { clearTimeout(timer); sb.removeChannel(channel) }
  }, [userId, router])
  return null
}
