'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function CartItemControls({ productId, qty }: { productId: string; qty: number }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function setQty(next: number) {
    setBusy(true)
    const sb = supabaseBrowser()
    const { error } = next <= 0
      ? await sb.from('cart_items').delete().eq('product_id', productId)
      : await sb.from('cart_items').update({ qty: next }).eq('product_id', productId)
    setBusy(false)
    if (error) return alert(`Could not update cart: ${error.message}`)
    router.refresh()
  }

  const btn = 'w-8 h-8 rounded-lg bg-surface-container-highest hover:bg-surface-dim flex items-center justify-center disabled:opacity-50'
  return (
    <div className="flex items-center gap-space-xs">
      <button type="button" disabled={busy} onClick={() => setQty(qty - 1)} aria-label="Decrease quantity" className={btn}><span className="material-symbols-outlined text-lg">remove</span></button>
      <span className="w-8 text-center font-metric-label text-metric-label font-bold">{qty}</span>
      <button type="button" disabled={busy} onClick={() => setQty(qty + 1)} aria-label="Increase quantity" className={btn}><span className="material-symbols-outlined text-lg">add</span></button>
      <button type="button" disabled={busy} onClick={() => setQty(0)} aria-label="Remove item" className="w-8 h-8 rounded-lg hover:bg-error-container text-error flex items-center justify-center ms-space-xs disabled:opacity-50"><span className="material-symbols-outlined text-lg">delete</span></button>
    </div>
  )
}
