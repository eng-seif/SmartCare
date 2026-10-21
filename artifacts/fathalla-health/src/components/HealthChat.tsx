'use client'
import { useEffect, useRef, useState } from 'react'

type Lang = 'en' | 'ar'
type Msg = { role: 'user' | 'assistant'; content: string }

const T = {
  en: {
    title: 'Nutrition Assistant', sub: 'General guidance, not medical advice',
    intro: 'Hi, I can help you read food labels and compare groceries. I give general nutrition guidance only. I cannot diagnose or tell you a food is guaranteed safe. Ask your doctor about your own care.',
    warn: 'Your messages are sent to an AI service. Do not include your name, email or other personal details.',
    suggestions: ['What does glycemic index mean?', 'How do I spot hidden sugar on a label?', 'Which Fathalla items are lower in sodium?'],
    placeholder: 'Ask about a food or a label', send: 'Send', clear: 'Clear chat', retry: 'Retry',
    useProfile: 'Use my health profile for this chat', noProfile: 'Sign in and set a profile to enable',
    profileNote: 'Changing this setting starts a new chat.',
    thinking: 'Thinking', error: 'Something went wrong. Please try again.', label: 'Your question',
    catOn: 'Fathalla catalog connected', catOff: 'General guidance only, catalog not connected',
    you: 'You', bot: 'Assistant', log: 'Conversation', suggestLabel: 'Suggested questions', chars: 'characters',
    resets: 'Allowance resets:',
  },
  ar: {
    title: 'مساعد التغذية', sub: 'إرشادات عامة وليست نصيحة طبية',
    intro: 'أهلاً، أساعدك في قراءة ملصقات الأغذية ومقارنة المنتجات. أقدم إرشادات غذائية عامة فقط، ولا أشخّص الحالات ولا أضمن أن أي منتج آمن. اسأل طبيبك عن حالتك.',
    warn: 'يتم إرسال رسائلك إلى خدمة ذكاء اصطناعي. لا تكتب اسمك أو بريدك أو أي بيانات شخصية.',
    suggestions: ['ما معنى مؤشر نسبة السكر في الدم؟', 'كيف أكتشف السكر المخفي في الملصق؟', 'ما المنتجات الأقل صوديوم في فتح الله؟'],
    placeholder: 'اسأل عن منتج أو ملصق', send: 'إرسال', clear: 'مسح المحادثة', retry: 'إعادة المحاولة',
    useProfile: 'استخدم ملفي الصحي في هذه المحادثة', noProfile: 'سجّل الدخول وأضف ملفاً صحياً للتفعيل',
    profileNote: 'تغيير الاختيار يبدأ محادثة جديدة.',
    thinking: 'جارٍ التفكير', error: 'حدث خطأ. حاول مرة أخرى.', label: 'سؤالك',
    catOn: 'كتالوج فتح الله متصل', catOff: 'إرشادات عامة فقط، الكتالوج غير متصل',
    you: 'أنت', bot: 'المساعد', log: 'المحادثة', suggestLabel: 'أسئلة مقترحة', chars: 'حرف',
    resets: 'يتجدد الاستخدام:',
  },
}

export default function HealthChat({ lang = 'en', profileAvailable, compact = false }: { lang?: Lang; profileAvailable: boolean; compact?: boolean }) {
  const t = T[lang] ?? T.en
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [useProfile, setUseProfile] = useState(false)
  const [catalog, setCatalog] = useState<boolean | null>(null)
  const [quotaNotice, setQuotaNotice] = useState<{ message: string; resetAt: string } | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const busyRef = useRef(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => abortRef.current?.abort(), [])
  useEffect(() => {
    if (!quotaNotice) return
    const timer = setTimeout(() => setQuotaNotice(null), Math.max(0, Date.parse(quotaNotice.resetAt) - Date.now()))
    return () => clearTimeout(timer)
  }, [quotaNotice])
  useEffect(() => { if (!profileAvailable) setUseProfile(false) }, [profileAvailable])
  useEffect(() => {
    const el = endRef.current?.parentElement
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading, failed])

  async function run(history: Msg[]) {
    if (busyRef.current || (quotaNotice && Date.parse(quotaNotice.resetAt) > Date.now())) return
    busyRef.current = true
    setLoading(true); setFailed(false); setErrorMessage('')
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const res = await fetch('/assistant/chat', {
        method: 'POST', credentials: 'include', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.slice(-10).map(m => ({ role: m.role, content: m.content.slice(0, 1500) })),
          lang, useProfile: profileAvailable && useProfile,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (ctrl.signal.aborted) return
      if (res.status === 429 && ['CHAT_DAILY_LIMIT', 'CHAT_PROJECT_LIMIT'].includes(data.code) &&
          typeof data.error === 'string' && typeof data.resetAt === 'string' && Number.isFinite(Date.parse(data.resetAt))) {
        setQuotaNotice({ message: data.error, resetAt: data.resetAt })
        return
      }
      if (!res.ok || typeof data.reply !== 'string') throw new Error(data?.error || 'error')
      setCatalog(Boolean(data.catalogAvailable))
      setMessages(m => [...m, { role: 'assistant', content: data.reply }])
    } catch (e) {
      if ((e as Error).name !== 'AbortError' && !ctrl.signal.aborted) {
        setFailed(true)
        setErrorMessage(e instanceof Error && e.message !== 'error' ? e.message : t.error)
      }
    } finally {
      if (abortRef.current === ctrl) {
        abortRef.current = null
        busyRef.current = false
        setLoading(false)
      }
    }
  }

  function send(text: string) {
    const c = text.trim().slice(0, 1500)
    if (!c || busyRef.current || (quotaNotice && Date.parse(quotaNotice.resetAt) > Date.now())) return
    const next = [...messages, { role: 'user' as const, content: c }]
    setMessages(next); setInput('')
    void run(next)
  }

  function clear() {
    abortRef.current?.abort()
    abortRef.current = null
    busyRef.current = false
    setMessages([]); setInput(''); setFailed(false); setLoading(false); setErrorMessage('')
    setCatalog(null); setUseProfile(false)
  }

  const status = catalog === null ? t.sub : catalog ? t.catOn : t.catOff

  return (
    <section data-no-translate aria-label={t.title} dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="bg-surface-container-lowest border-2 border-surface-container-high rounded-xl p-space-md sm:p-space-lg shadow-sm flex flex-col gap-space-md min-w-0">
      <div className="flex items-start justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-2xl" aria-hidden="true">forum</span>
          </div>
          <div className="min-w-0">
            <h2 className="font-title-md text-title-md text-on-surface font-bold">{t.title}</h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant" role="status">{status}</p>
          </div>
        </div>
        <button type="button" onClick={clear} disabled={!messages.length && !input}
          className="shrink-0 px-space-sm py-1 rounded-lg border border-surface-variant/60 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40">
          {t.clear}
        </button>
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low border border-surface-variant/40 rounded-lg px-space-sm py-space-xs">{t.warn}</p>

      <div role="log" aria-label={t.log} aria-live="polite"
        className={`${compact ? 'h-56' : 'h-72'} overflow-y-auto flex flex-col gap-space-sm bg-surface-container-low rounded-xl border border-surface-variant/40 p-space-sm`}>
        <div className="max-w-[90%] self-start rounded-xl rounded-ss-sm bg-surface-container-lowest border border-surface-variant/40 px-space-md py-space-sm font-body-md text-body-md text-on-surface">{t.intro}</div>
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[90%] rounded-xl px-space-md py-space-sm font-body-md text-body-md whitespace-pre-wrap break-words ${m.role === 'user'
            ? 'self-end rounded-se-sm bg-primary-container text-on-secondary'
            : 'self-start rounded-ss-sm bg-surface-container-lowest border border-surface-variant/40 text-on-surface'}`}>
            <span className="sr-only">{m.role === 'user' ? t.you : t.bot}: </span>{m.content}
          </div>
        ))}
        {loading && <div className="self-start font-body-sm text-body-sm text-on-surface-variant animate-pulse px-space-sm">{t.thinking}...</div>}
        {failed && (
          <div role="alert" className="self-start flex flex-wrap items-center gap-space-sm rounded-lg bg-error-container text-on-error-container px-space-md py-space-sm font-body-sm text-body-sm">
            <span>{errorMessage || t.error}</span>
            <button type="button" onClick={() => void run(messages)} className="underline font-bold">{t.retry}</button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length === 0 && (
        <div role="group" aria-label={t.suggestLabel} className="flex flex-wrap gap-space-xs">
          {t.suggestions.map(s => (
            <button key={s} type="button" onClick={() => send(s)} disabled={loading || Boolean(quotaNotice)}
              className="px-space-sm py-1 rounded-full border border-surface-variant/60 bg-surface-container-lowest font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low text-start">
              {s}
            </button>
          ))}
        </div>
      )}

      <label className={`flex items-start gap-space-sm font-body-sm text-body-sm ${profileAvailable ? 'text-on-surface' : 'text-on-surface-variant'}`}>
        <input type="checkbox" className="mt-0.5" checked={useProfile} disabled={!profileAvailable} onChange={e => {
          const checked = e.target.checked
          clear()
          setUseProfile(checked)
        }} />
        <span>{t.useProfile}<span className="block text-on-surface-variant">{profileAvailable ? t.profileNote : t.noProfile}</span></span>
      </label>

      {quotaNotice && (
        <p role="alert" className="rounded-lg bg-error-container text-on-error-container px-space-md py-space-sm font-body-sm text-body-sm">
          {quotaNotice.message}<br />
          {t.resets} {new Date(quotaNotice.resetAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB')}
        </p>
      )}

      <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex items-end gap-space-sm">
        <div className="flex-1 min-w-0">
          <label htmlFor="health-chat-input" className="sr-only">{t.label}</label>
          <input id="health-chat-input" value={input} maxLength={1500} onChange={e => setInput(e.target.value)}
            placeholder={t.placeholder} autoComplete="off"
            className="w-full h-11 px-space-md rounded-lg bg-surface-container-lowest border border-surface-variant text-on-surface font-body-md text-body-md placeholder:text-on-surface-variant" />
        </div>
        <button type="submit" disabled={loading || Boolean(quotaNotice) || !input.trim()}
          className="h-11 px-space-md bg-primary-container text-on-secondary rounded-lg font-title-md text-title-md disabled:opacity-50 flex items-center gap-1">
          <span className="material-symbols-outlined text-xl rtl:-scale-x-100" aria-hidden="true">send</span>
          <span>{t.send}</span>
        </button>
      </form>
    </section>
  )
}
