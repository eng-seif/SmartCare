'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'
import { CONDITIONS } from '@/lib/health'

type Init = { full_name: string; age: number | string; gender: string; conditions: string[]; max_sugar_g: number; max_carbs_g: number; max_sodium_mg: number }
const field = 'w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all'
const card = 'bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border border-surface-variant/40 flex flex-col gap-6'

export default function ProfileForm({ userId, email, initial }: { userId: string; email: string; initial: Init }) {
  const [f, setF] = useState(initial)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const set = (k: keyof Init) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null)
    const { error } = await supabaseBrowser().from('profiles').upsert({
      id: userId, full_name: f.full_name, age: Number(f.age) || null, gender: f.gender, conditions: f.conditions,
      max_sugar_g: Number(f.max_sugar_g), max_carbs_g: Number(f.max_carbs_g), max_sodium_mg: Number(f.max_sodium_mg),
    })
    setBusy(false)
    if (error) return setMsg({ ok: false, text: error.message })
    setMsg({ ok: true, text: 'Profile saved. Your verdicts are now recalculated.' }); router.refresh()
  }

  return (
    <div className="w-full bg-gradient-to-b from-surface-container-low via-surface to-surface pb-24">
      <form onSubmit={save} className="max-w-3xl mx-auto px-6 pt-10 flex flex-col gap-8">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Edit Your Health Profile</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Signed in as {email}</p>
        </div>

        <div className={card}>
          <h2 className="font-title-lg text-title-lg text-on-surface font-bold">Personal Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input className={`${field} md:col-span-2`} placeholder="Full name" value={f.full_name} onChange={set('full_name')} />
            <input className={field} type="number" min={12} max={110} placeholder="Age" value={f.age} onChange={set('age')} />
            <select className={field} value={f.gender} onChange={set('gender')}><option value="male">Male</option><option value="female">Female</option></select>
          </div>
        </div>

        <div className={card}>
          <h2 className="font-title-lg text-title-lg text-on-surface font-bold">Chronic Health Conditions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {Object.entries(CONDITIONS).map(([k, label]) => {
              const on = f.conditions.includes(k)
              return (
                <label key={k} className={`flex items-center gap-3.5 p-4 rounded-xl cursor-pointer transition-all border ${on ? 'bg-primary/5 ring-2 ring-primary-container border-primary-container/40' : 'bg-surface-container-low hover:bg-surface-container border-transparent'}`}>
                  <input type="checkbox" checked={on} onChange={() => setF({ ...f, conditions: on ? f.conditions.filter(x => x !== k) : [...f.conditions, k] })} className="w-5 h-5 accent-primary-container" />
                  <span className="font-title-md text-title-md text-on-surface font-semibold">{label}</span>
                </label>
              )
            })}
          </div>
        </div>

        <div className={card}>
          <h2 className="font-title-lg text-title-lg text-on-surface font-bold">Target Intake Safeguards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {([['max_sugar_g', 'Sugar screening limit (g)'], ['max_carbs_g', 'Max net carbs (g)'], ['max_sodium_mg', 'Max sodium (mg)']] as const).map(([k, label]) => (
              <label key={k} className="flex flex-col gap-1.5"><span className="font-label-md text-label-md text-on-surface font-semibold">{label}</span>
                <input className={field} type="number" min={0} value={f[k]} onChange={set(k)} /></label>
            ))}
          </div>
        </div>

        {msg && <p className={`font-body-md ${msg.ok ? 'text-tertiary font-semibold' : 'text-error'}`}>{msg.text}</p>}
        <button disabled={busy} className="w-full sm:w-auto self-start px-8 py-4 bg-primary-container hover:bg-primary text-on-primary font-title-lg text-title-lg rounded-xl shadow-lg font-bold disabled:opacity-60" type="submit">
          {busy ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
