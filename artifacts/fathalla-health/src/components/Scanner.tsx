'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase/client'
import { evaluate, nutrition, type Product } from '@/lib/health'
import { enrichProduct } from '@/lib/product-nutrition'
import { TONE } from './HealthBadge'
import AddToCartButton from './AddToCartButton'

export default function Scanner() {
  const video = useRef<HTMLVideoElement>(null)
  const [msg, setMsg] = useState('Point your camera at any grocery item for an instant clinical verdict.')
  const [code, setCode] = useState('')
  const [found, setFound] = useState<Product | null>(null)
  const [conds, setConds] = useState<string[]>([])

  async function lookup(barcode: string) {
    const sb = supabaseBrowser()
    const { data: { user } } = await sb.auth.getUser()
    if (user) { const { data: pr } = await sb.from('profiles').select('conditions').eq('id', user.id).single(); setConds(pr?.conditions ?? []) }
    const { data } = await sb.from('products').select('*').eq('barcode', barcode).maybeSingle()
    if (data) { setFound(enrichProduct(data as Product)); setMsg(`Barcode ${barcode} matched.`) }
    else { setFound(null); setMsg(`No product found for barcode ${barcode}.`) }
  }

  useEffect(() => {
    let stream: MediaStream | undefined, stop = false
    async function start() {
      // Chrome on Windows/Linux (and Brave) have no native BarcodeDetector, so fall back to a ZXing-based one
      let Detector = (window as any).BarcodeDetector
      if (!Detector) Detector = ((await import('barcode-detector/ponyfill')) as any).BarcodeDetector
      const det = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'qr_code'] })
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      } catch { return setMsg('Camera access was denied. Allow the camera in the address bar, or enter the barcode manually.') }
      if (stop || !video.current) return stream.getTracks().forEach(t => t.stop())
      video.current.srcObject = stream
      await video.current.play()
      setMsg('Point your camera at a barcode. Hold it steady about 15-25 cm away.')
      const tick = async () => {
        if (stop || !video.current) return
        const r = await det.detect(video.current).catch(() => [])
        if (r[0]) { await lookup(r[0].rawValue); setTimeout(tick, 2500); return }
        setTimeout(tick, 200)
      }
      tick()
    }
    start().catch(() => setMsg('Could not start the scanner. Enter the barcode manually.'))
    return () => { stop = true; stream?.getTracks().forEach(t => t.stop()) }
  }, [])

  const v = found ? evaluate(found, conds) : null
  const t = v ? TONE[v.verdict] : null
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-margin-tablet lg:px-margin-desktop py-space-md">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
        <section className="lg:col-span-6 flex flex-col gap-space-md">
          <div className="relative bg-inverse-surface rounded-xl overflow-hidden shadow-xl aspect-[4/3] sm:aspect-[16/11] flex items-center justify-center">
            <video ref={video} playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-60" />
            <div className="relative z-10 w-64 h-44 sm:w-80 sm:h-52">
              {['top-0 left-0 border-t-2 border-l-2 rounded-tl-sm', 'top-0 right-0 border-t-2 border-r-2 rounded-tr-sm', 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-sm', 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-sm']
                .map(c => <div key={c} className={`absolute w-6 h-6 border-primary-container ${c}`}></div>)}
              <div className="absolute top-1/2 w-full h-0.5 bg-gradient-to-r from-transparent via-primary-container to-transparent animate-[bounce_2.5s_infinite]" style={{ boxShadow: '0 0 12px var(--color-primary-container)' }}></div>
            </div>
          </div>
          <div className="flex items-center gap-space-sm px-space-md py-space-sm bg-surface-container-low rounded-lg">
            <span className="material-symbols-outlined text-primary text-xl shrink-0">info</span>
            <p className="font-body-md text-body-md text-on-surface-variant">{msg}</p>
          </div>
          <form onSubmit={e => { e.preventDefault(); lookup(code.trim()) }} className="flex gap-space-sm">
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="Enter barcode, e.g. 6221000111001" inputMode="numeric"
              className="flex-1 h-12 px-space-md rounded-lg bg-surface-container-low text-on-surface font-metric-label focus:outline-none focus:ring-2 focus:ring-primary-container" />
            <button className="h-12 px-space-lg rounded-lg bg-inverse-surface text-inverse-on-surface font-title-md flex items-center gap-space-xs" type="submit">
              <span className="material-symbols-outlined text-xl">keyboard</span>Look up
            </button>
          </form>
        </section>

        <section className="lg:col-span-6">
          {found && v && t ? (
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col gap-space-lg border border-surface-variant/40">
              <div className={`${t.soft} rounded-xl p-space-md flex items-center gap-space-md`}>
                <div className={`w-12 h-12 rounded-full text-white flex items-center justify-center shrink-0 ${t.dot}`}><span className="material-symbols-outlined text-3xl">{v.verdict === 'safe' ? 'verified' : 'warning'}</span></div>
                <div className="flex flex-col">
                  <span className={`font-label-sm uppercase tracking-wider font-bold ${t.text}`}>Profile Match</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">{t.title}</h2>
                </div>
              </div>
              <div className="flex items-start justify-between gap-space-md">
                <div>
                  <h1 className="font-headline-md text-headline-md text-on-surface font-bold">{found.title}</h1>
                  <span className="font-metric-label text-metric-label text-on-surface-variant">CODE: {found.barcode}</span>
                </div>
                <span className="font-metric-display text-metric-display text-primary font-bold">{Number(found.price).toFixed(2)} <span className="font-label-md text-on-surface">EGP</span></span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                {[['Sugar', nutrition(found.sugar_content, 'g')], ['Net Carbs', nutrition(found.net_carbs, 'g')], ['Glycemic Index', nutrition(found.glycemic_index)]].map(([k, val]) => (
                  <div key={k} className="bg-surface-container-low p-space-md rounded-xl border border-surface-variant/30"><span className="font-label-sm text-on-surface-variant uppercase font-medium">{k}</span><div className="font-metric-display text-metric-display text-on-surface font-bold">{val}</div></div>
                ))}
              </div>
              {v.reasons.length > 0 && <ul className="list-disc ps-5 font-body-md text-error">{v.reasons.map(r => <li key={r}>{r}</li>)}</ul>}
              <div className="flex flex-col sm:flex-row gap-space-sm">
                <AddToCartButton productId={found.id} label="Add to Cart Now" className="w-full sm:flex-1" />
                <Link href={`/product/${found.id}`} className="h-12 px-space-lg bg-inverse-surface text-inverse-on-surface font-title-md rounded-lg flex items-center justify-center gap-space-xs">
                  <span className="material-symbols-outlined text-xl">swap_horiz</span>Alternatives
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-space-lg border border-surface-variant/40 text-secondary font-body-lg">Scan a barcode to see the clinical verdict here.</div>
          )}
        </section>
      </div>
    </div>
  )
}
