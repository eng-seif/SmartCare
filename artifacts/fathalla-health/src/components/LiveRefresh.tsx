'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

// Re-renders the server data whenever this user's cart/profile changes (any tab/device) or the tab regains focus.
export default function LiveRefresh({ userId }: { userId: string }) {
  const router = useRouter()
  useEffect(() => {
    const sb = supabaseBrowser()
    let timer: ReturnType<typeof setTimeout>
    const refresh = () => { clearTimeout(timer); timer = setTimeout(() => router.refresh(), 250) }
    const channel = sb.channel(`live-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, refresh)
      .subscribe()
    const onVisible = () => { if (document.visibilityState === 'visible') router.refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearTimeout(timer); sb.removeChannel(channel); document.removeEventListener('visibilitychange', onVisible) }
  }, [userId, router])
  return null
}
