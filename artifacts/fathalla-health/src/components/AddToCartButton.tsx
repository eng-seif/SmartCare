'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function AddToCartButton({ productId, label = 'Add to Cart', icon = 'add_shopping_cart', className = '' }:
  { productId: string; label?: string; icon?: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const router = useRouter()
  async function add() {
    setState('busy')
    const sb = supabaseBrowser()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return router.push('/register')
    const { data: row } = await sb.from('cart_items').select('qty').eq('product_id', productId).maybeSingle()
    const { error } = await sb.from('cart_items').upsert({ user_id: user.id, product_id: productId, qty: (row?.qty ?? 0) + 1 }, { onConflict: 'user_id,product_id' })
    if (error) { console.error(error); setState('idle'); alert(`Could not add to cart: ${error.message}`); return }
    setState('done'); router.refresh()
    setTimeout(() => setState('idle'), 1500)
  }
  return (
    <button onClick={add} disabled={state === 'busy'} type="button"
      className={`h-12 px-space-md rounded-lg text-white font-title-md text-title-md font-bold flex items-center justify-center gap-space-sm shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 ${state === 'done' ? 'bg-tertiary' : 'bg-primary-container hover:bg-primary-container/90'} ${className}`}>
      <span className="material-symbols-outlined text-xl">{state === 'done' ? 'check_circle' : icon}</span>
      {state === 'done' ? 'Added!' : label}
    </button>
  )
}
