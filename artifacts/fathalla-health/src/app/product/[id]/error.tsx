'use client'
import Link from 'next/link'

export default function ProductError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center flex flex-col items-center gap-4">
      <span className="material-symbols-outlined text-5xl text-error">error</span>
      <h1 className="font-headline-md text-headline-md text-on-surface font-bold">Could not load product details</h1>
      <p className="font-body-md text-on-surface-variant">There was a temporary issue loading this item.</p>
      <div className="flex gap-3">
        <button type="button" onClick={reset} className="px-5 py-2.5 rounded-lg bg-primary-container text-on-primary font-bold">Try again</button>
        <Link href="/" className="px-5 py-2.5 rounded-lg border border-surface-variant text-on-surface font-semibold">Back to market</Link>
      </div>
    </div>
  )
}
