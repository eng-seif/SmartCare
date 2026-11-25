'use client'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { CONDITIONS } from '@/lib/health'

const field = 'w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface placeholder:text-secondary font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all'
const card = 'bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm border border-surface-variant/40 flex flex-col gap-6'

const COND_AR: Record<string, string> = {
  t2d: 'السكري من النوع الثاني',
  t1d: 'السكري من النوع الأول',
  prediabetes: 'مقدمات السكري / مقاومة الإنسولين',
  hypertension: 'ارتفاع ضغط الدم',
  cardio: 'أمراض القلب والكوليسترول',
  lactose: 'حساسية اللاكتوز',
  celiac: 'حساسية الجلوتين / السيلياك',
}

function mapAuthError(message: string, ar: boolean): { text: string; unconfirmed: boolean } {
  const lower = message.toLowerCase()
  if (lower.includes('email not confirmed')) {
    return {
      unconfirmed: true,
      text: ar
        ? 'الحساب لم يتم تفعيله بعد. افتح بريدك الإلكتروني واضغط رابط التفعيل، أو أعد إرسال الرابط.'
        : 'Your email is not confirmed yet. Check your inbox for the confirmation link, or resend it below.',
    }
  }
  if (lower.includes('invalid login credentials')) {
    return {
      unconfirmed: false,
      text: ar ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Invalid email or password.',
    }
  }
  if (lower.includes('user already registered')) {
    return {
      unconfirmed: false,
      text: ar ? 'هذا البريد مسجّل بالفعل. جرّب تسجيل الدخول.' : 'This email is already registered. Try signing in instead.',
    }
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return {
      unconfirmed: false,
      text: ar ? 'محاولات كثيرة في وقت قصير. انتظر دقيقة وحاول مجددًا.' : 'Too many attempts. Please wait a minute and try again.',
    }
  }
  return { unconfirmed: false, text: message }
}

export default function RegisterForm({ initialMode = 'signup', lang = 'en' }: { initialMode?: 'signup' | 'login'; lang?: 'ar' | 'en' }) {
  const ar = lang === 'ar'
  const [f, setF] = useState({ full_name: '', email: '', password: '', age: '', gender: 'male' })
  const [conds, setConds] = useState<string[]>([])
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode)
  const [err, setErr] = useState('')
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })

  function switchMode(next: 'signup' | 'login') {
    setMode(next)
    setErr('')
    setNotice('')
    setUnconfirmed(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setNotice('')
    setUnconfirmed(false)
    const email = f.email.trim()
    if (!email) return
    setBusy(true)
    try {
      const sb = supabaseBrowser()
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=/cart`
      const res = mode === 'signup'
        ? await sb.auth.signUp({
            email,
            password: f.password,
            options: {
              emailRedirectTo,
              data: { full_name: f.full_name.trim(), age: Number(f.age) || null, gender: f.gender, conditions: conds },
            },
          })
        : await sb.auth.signInWithPassword({ email, password: f.password })
      if (res.error) {
        const mapped = mapAuthError(res.error.message, ar)
        setUnconfirmed(mapped.unconfirmed)
        setErr(mapped.text)
        return
      }
      if (!res.data.session) {
        setNotice(ar
          ? 'تم إنشاء الحساب! افحص بريدك الإلكتروني واضغط رابط التفعيل ثم سجّل الدخول.'
          : 'Account created! Check your email and click the confirmation link, then sign in.')
        return
      }
      setOk(true)
      window.location.assign('/cart')
    } catch (error) {
      setErr(error instanceof Error ? error.message : (ar ? 'تعذّر الاتصال بخدمة الحسابات.' : 'Could not connect to authentication service.'))
    } finally {
      setBusy(false)
    }
  }

  async function resendConfirmation() {
    const email = f.email.trim()
    if (!email) return
    setBusy(true)
    setErr('')
    setNotice('')
    try {
      const sb = supabaseBrowser()
      const { error } = await sb.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/cart` },
      })
      if (error) setErr(mapAuthError(error.message, ar).text)
      else setNotice(ar ? 'تم إعادة إرسال رابط التفعيل لبريدك الإلكتروني.' : 'Confirmation email resent. Please check your inbox.')
    } catch {
      setErr(ar ? 'تعذّر إعادة الإرسال.' : 'Could not resend confirmation email.')
    } finally {
      setBusy(false)
    }
  }

  async function resetPassword() {
    const email = f.email.trim()
    if (!email) {
      setErr(ar ? 'اكتب بريدك الإلكتروني أولًا لإرسال رابط استعادة كلمة المرور.' : 'Enter your email address first to reset your password.')
      return
    }
    setBusy(true)
    setErr('')
    setNotice('')
    try {
      const sb = supabaseBrowser()
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      })
      if (error) setErr(mapAuthError(error.message, ar).text)
      else setNotice(ar ? 'تم إرسال رابط استعادة كلمة المرور لبريدك الإلكتروني.' : 'Password reset link sent to your email.')
    } catch {
      setErr(ar ? 'تعذّر إرسال رابط استعادة كلمة المرور.' : 'Could not send password reset email.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="w-full bg-gradient-to-b from-surface-container-low via-surface to-surface pb-24">
      <div className="max-w-3xl mx-auto px-6 pt-6 flex flex-col gap-6">
        <div className="inline-flex p-1 rounded-xl bg-surface-container-high w-fit border border-surface-variant/60">
          <button type="button" onClick={() => switchMode('login')}
            className={`px-5 py-2.5 rounded-lg font-title-md text-title-md font-bold transition-all ${mode === 'login' ? 'bg-primary-container text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
            {ar ? 'تسجيل الدخول' : 'Sign in'}
          </button>
          <button type="button" onClick={() => switchMode('signup')}
            className={`px-5 py-2.5 rounded-lg font-title-md text-title-md font-bold transition-all ${mode === 'signup' ? 'bg-primary-container text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
            {ar ? 'حساب جديد' : 'Create account'}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed w-fit">
            <span className="material-symbols-outlined text-[14px]">vital_signs</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wide">{ar ? 'ملف صحي مخصّص' : 'Personalized Metabolic Enrollment'}</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
            {mode === 'signup'
              ? (ar ? 'أنشئ حسابك الصحي للتسوق' : 'Create Your Personalized Health & Grocery Account')
              : (ar ? 'مرحبًا بعودتك' : 'Welcome back')}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {ar
              ? 'نقيّم المنتجات بناءً على حالتك الصحية لمساعدتك على تقليل السكر الزائد والصوديوم أثناء التسوق.'
              : 'We calibrate every product in Fathalla based on your health conditions, removing hidden sugars and excess sodium before you shop.'}
          </p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={submit}>
          <div className={card}>
            <div className="flex items-center gap-3 pb-3 border-b border-surface-container-high/60">
              <span className="material-symbols-outlined text-primary text-[24px]">badge</span>
              <span className="font-title-lg text-title-lg text-on-surface font-bold">
                {mode === 'signup'
                  ? (ar ? 'البيانات الشخصية وبيانات الحساب' : 'Part 1: Personal & Account Details')
                  : (ar ? 'بيانات الدخول' : 'Account Details')}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {mode === 'signup' && <>
                <input className={`${field} md:col-span-2`} placeholder={ar ? 'الاسم الكامل' : 'Full name'} value={f.full_name} onChange={set('full_name')} required />
                <input className={field} type="number" min={12} max={110} placeholder={ar ? 'العمر' : 'Age'} value={f.age} onChange={set('age')} />
                <select className={field} value={f.gender} onChange={set('gender')}>
                  <option value="male">{ar ? 'ذكر' : 'Male'}</option>
                  <option value="female">{ar ? 'أنثى' : 'Female'}</option>
                </select>
              </>}
              <input className={`${field} md:col-span-2`} type="email" placeholder={ar ? 'البريد الإلكتروني' : 'Email address'} value={f.email} onChange={set('email')} required />
              <input className={`${field} md:col-span-2`} type="password" placeholder={ar ? 'كلمة المرور (6 أحرف على الأقل)' : 'Password (min 6 characters)'} minLength={6} value={f.password} onChange={set('password')} required />
            </div>
            {mode === 'login' && (
              <div className="flex justify-end">
                <button type="button" onClick={resetPassword} disabled={busy} className="text-sm text-primary font-semibold hover:underline">
                  {ar ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </button>
              </div>
            )}
          </div>

          {mode === 'signup' && (
            <div className={card}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                  {ar ? 'اختر الحالات الصحية' : 'Select Your Chronic Health Conditions'}
                </h2>
                <span className="shrink-0 bg-primary-fixed/60 text-on-primary-fixed px-3 py-1.5 rounded-lg font-metric-label text-metric-label font-bold">
                  {conds.length} {ar ? 'محددة' : 'ACTIVE'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {Object.entries(CONDITIONS).map(([k, label]) => {
                  const on = conds.includes(k)
                  return (
                    <label key={k} className={`flex items-center gap-3.5 p-4 rounded-xl cursor-pointer transition-all border ${on ? 'bg-primary/5 ring-2 ring-primary-container border-primary-container/40' : 'bg-surface-container-low hover:bg-surface-container border-transparent'}`}>
                      <input type="checkbox" checked={on} onChange={() => setConds(on ? conds.filter(x => x !== k) : [...conds, k])} className="w-5 h-5 accent-primary-container shrink-0" />
                      <span className="font-title-md text-title-md text-on-surface font-semibold">{ar ? (COND_AR[k] ?? label) : label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {err && (
            <div role="alert" className="rounded-xl bg-error-container text-on-error-container px-4 py-3 flex flex-col gap-2">
              <p className="font-body-md font-medium">{err}</p>
              {unconfirmed && (
                <button type="button" onClick={resendConfirmation} disabled={busy} className="self-start underline font-bold text-sm">
                  {ar ? 'إعادة إرسال رابط التفعيل' : 'Resend confirmation email'}
                </button>
              )}
            </div>
          )}
          {notice && <p role="status" className="rounded-xl bg-tertiary-fixed/40 text-on-tertiary-fixed px-4 py-3 font-body-md font-semibold">{notice}</p>}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button disabled={busy} className="w-full sm:w-auto px-8 py-4 disabled:opacity-60 bg-primary-container hover:bg-primary text-on-primary font-title-lg text-title-lg rounded-xl shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all font-bold" type="submit">
              <span>
                {ok
                  ? (ar ? '✓ تم بنجاح! جارٍ التحويل...' : '✓ Done! Redirecting...')
                  : busy
                    ? (ar ? 'جارٍ التنفيذ...' : 'Please wait...')
                    : mode === 'signup'
                      ? (ar ? 'إنشاء الحساب وتفعيل السلة الذكية' : 'Complete Registration & Activate Safe Cart')
                      : (ar ? 'تسجيل الدخول' : 'Sign in')}
              </span>
              <span className="material-symbols-outlined text-[20px] rtl:-scale-x-100">arrow_forward</span>
            </button>
            <button type="button" onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')} className="font-title-md text-title-md text-primary font-semibold hover:underline">
              {mode === 'signup'
                ? (ar ? 'عندك حساب بالفعل؟ سجّل الدخول' : 'Already registered? Sign in')
                : (ar ? 'مستخدم جديد؟ أنشئ حسابًا' : 'New here? Create an account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
