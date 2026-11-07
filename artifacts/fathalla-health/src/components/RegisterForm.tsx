'use client'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { CONDITIONS } from '@/lib/health'

const field = 'w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface placeholder:text-secondary font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all'
const card = 'bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border border-surface-variant/40 flex flex-col gap-6'

export default function RegisterForm({ initialMode = 'signup' }: { initialMode?: 'signup' | 'login' }) {
  const [f, setF] = useState({ full_name: '', email: '', password: '', age: '', gender: 'male' })
  const [conds, setConds] = useState<string[]>([])
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setNotice(''); setBusy(true)
    const sb = supabaseBrowser()
    const res = mode === 'signup'
      ? await sb.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.full_name, age: Number(f.age) || null, gender: f.gender, conditions: conds } } })
      : await sb.auth.signInWithPassword({ email: f.email, password: f.password })
    setBusy(false)
    if (res.error) return setErr(res.error.message)
    // No session = Supabase is waiting for the user to confirm their email
    if (!res.data.session) return setNotice('Account created. Check your email and confirm it, then sign in.')
    setOk(true)
    window.location.assign('/cart') // full reload so the server sees the new session cookie
  }

  return (
    <div className="w-full bg-gradient-to-b from-surface-container-low via-surface to-surface pb-24">
      <div className="max-w-3xl mx-auto px-6 pt-10 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed w-fit">
            <span className="material-symbols-outlined text-[14px]">vital_signs</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wide">Personalized Metabolic Enrollment</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">{mode === 'signup' ? 'Create Your Personalized Health & Grocery Account' : 'Welcome back'}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">We calibrate every product in Fathalla based on your health conditions, removing hidden sugars and excess sodium before you shop.</p>
        </div>

        <form className="flex flex-col gap-8" onSubmit={submit}>
          <div className={card}>
            <div className="flex items-center gap-3 pb-3 border-b border-surface-container-high/60">
              <span className="material-symbols-outlined text-primary text-[24px]">badge</span>
              <span className="font-title-lg text-title-lg text-on-surface font-bold">{mode === 'signup' ? 'Part 1: Personal & Account Details' : 'Account Details'}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {mode === 'signup' && <>
                <input className={`${field} md:col-span-2`} placeholder="Full name" value={f.full_name} onChange={set('full_name')} required />
                <input className={field} type="number" min={12} max={110} placeholder="Age" value={f.age} onChange={set('age')} />
                <select className={field} value={f.gender} onChange={set('gender')}><option value="male">Male</option><option value="female">Female</option></select>
              </>}
              <input className={`${field} md:col-span-2`} type="email" placeholder="Email address" value={f.email} onChange={set('email')} required />
              <input className={`${field} md:col-span-2`} type="password" placeholder="Password (min 6 characters)" minLength={6} value={f.password} onChange={set('password')} required />
            </div>
          </div>

          {mode === 'signup' && (
            <div className={card}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Select Your Chronic Health Conditions</h2>
                <span className="shrink-0 bg-primary-fixed/60 text-on-primary-fixed px-3 py-1.5 rounded-lg font-metric-label text-metric-label font-bold">{conds.length} ACTIVE</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {Object.entries(CONDITIONS).map(([k, label]) => {
                  const on = conds.includes(k)
                  return (
                    <label key={k} className={`flex items-center gap-3.5 p-4 rounded-xl cursor-pointer transition-all border ${on ? 'bg-primary/5 ring-2 ring-primary-container border-primary-container/40' : 'bg-surface-container-low hover:bg-surface-container border-transparent'}`}>
                      <input type="checkbox" checked={on} onChange={() => setConds(on ? conds.filter(x => x !== k) : [...conds, k])} className="w-5 h-5 accent-primary-container shrink-0" />
                      <span className="font-title-md text-title-md text-on-surface font-semibold">{label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {err && <p className="font-body-md text-error">{err}</p>}
          {notice && <p className="font-body-md text-tertiary font-semibold">{notice}</p>}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button disabled={busy} className="w-full sm:w-auto px-8 py-4 disabled:opacity-60 bg-primary-container hover:bg-primary text-on-primary font-title-lg text-title-lg rounded-xl shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all font-bold" type="submit">
              <span>{ok ? '✓ Done! Redirecting...' : busy ? 'Please wait...' : mode === 'signup' ? 'Complete Registration & Activate Safe Cart' : 'Sign in'}</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
            <button type="button" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')} className="font-title-md text-title-md text-primary font-semibold hover:underline">
              {mode === 'signup' ? 'Already registered? Sign in' : 'New here? Create an account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
