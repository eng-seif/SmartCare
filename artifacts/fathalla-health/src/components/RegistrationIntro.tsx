'use client'
import { useEffect, useState } from 'react'
import RegisterForm from './RegisterForm'

const KEY = 'fathalla-tutorial-v1'
export default function RegistrationIntro({ lang, configured = true, initialSeen = false }: { lang: 'ar' | 'en'; configured?: boolean; initialSeen?: boolean }) {
  const [show, setShow] = useState(!initialSeen)
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [failed, setFailed] = useState(false)
  const ar = lang === 'ar'
  useEffect(() => {
    try { if (localStorage.getItem(KEY) === 'done') setShow(false) } catch { /* Viewing remains optional when storage is unavailable. */ }
  }, [])
  function proceed(next: 'signup' | 'login') {
    try { localStorage.setItem(KEY, 'done') } catch {}
    // Also render the correct initial state on a full navigation, without
    // waiting for hydration or relying on third-party localStorage access.
    try { document.cookie = `${KEY}=done; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}` } catch {}
    setMode(next); setShow(false)
  }
  if (!show) return <div data-no-translate>
    <div className="max-w-3xl mx-auto px-6 pt-5"><button type="button" className="text-primary underline" onClick={() => { setFailed(false); setShow(true) }}>{ar ? 'شاهد شرح الاستخدام مرة أخرى' : 'Watch the usage guide again'}</button></div>
    <fieldset disabled={!configured} className="min-w-0"><RegisterForm key={mode} initialMode={mode} /></fieldset>
  </div>
  return <section data-no-translate dir={ar ? 'rtl' : 'ltr'} className="max-w-3xl mx-auto px-5 py-10">
    <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl p-5 sm:p-8 flex flex-col gap-5">
      <p className="text-primary font-bold">{ar ? 'قبل ما تبدأ' : 'Before you begin'}</p>
      <h1 className="text-2xl sm:text-3xl font-bold">{ar ? 'تعرّف على التطبيق في نصف دقيقة' : 'Get to know the app in half a minute'}</h1>
      <p className="text-on-surface-variant">{ar ? 'فيديو قصير يشرح البحث، قراءة الملصق، ومساعد التغذية. تقدر تتخطاه في أي وقت.' : 'A short Arabic guide to browsing, reading labels and asking the nutrition assistant. You can skip it at any time.'}</p>
      <video className="w-full aspect-video rounded-xl bg-black" src="/tutorial/video" controls playsInline preload="metadata" onError={() => setFailed(true)} onEnded={() => proceed('signup')} aria-label={ar ? 'فيديو شرح استخدام التطبيق' : 'How to use the app'}>
        <track kind="captions" src="/tutorial-ar.vtt" srcLang="ar" label="العربية" default />
      </video>
      {failed && <p role="status" className="text-on-surface-variant">{ar ? 'تعذّر تشغيل الفيديو. تقدر تكمل التسجيل أو تعيد تحميل الصفحة للمحاولة.' : 'The video could not load. You can continue to registration or reload to try again.'}</p>}
      <button type="button" onClick={() => proceed('signup')} className="rounded-xl bg-primary text-on-primary p-4 font-bold">{ar ? 'تخطي والانتقال للتسجيل' : 'Skip and create an account'}</button>
      <button type="button" onClick={() => proceed('login')} className="underline text-primary">{ar ? 'عندي حساب — تسجيل الدخول' : 'Already registered? Sign in'}</button>
      <p className="text-xs text-on-surface-variant">{ar ? 'المساعد يقدّم معلومات عامة عن التغذية، مش تشخيصًا أو وصف علاج.' : 'The assistant provides general nutrition education, not diagnosis or treatment.'}</p>
    </div>
  </section>
}
