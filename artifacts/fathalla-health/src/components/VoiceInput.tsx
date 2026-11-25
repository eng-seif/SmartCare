'use client'
import { useEffect, useRef, useState } from 'react'
import { Mic, Square, X } from 'lucide-react'

async function toWav(blob: Blob) {
  const context = new AudioContext()
  try {
    const audio = await context.decodeAudioData(await blob.arrayBuffer())
    if (audio.duration > 31 || audio.duration < .2) throw new Error('duration')
    const renderer = new OfflineAudioContext(1, Math.ceil(audio.duration * 16000), 16000)
    const source = renderer.createBufferSource(); source.buffer = audio; source.connect(renderer.destination); source.start()
    const samples = (await renderer.startRendering()).getChannelData(0)
    const buffer = new ArrayBuffer(44 + samples.length * 2), view = new DataView(buffer)
    const word = (offset: number, text: string) => [...text].forEach((c, n) => view.setUint8(offset + n, c.charCodeAt(0)))
    word(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); word(8, 'WAVE'); word(12, 'fmt ')
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
    view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true)
    word(36, 'data'); view.setUint32(40, samples.length * 2, true)
    samples.forEach((sample, n) => view.setInt16(44 + n * 2, Math.max(-1, Math.min(1, sample)) * (sample < 0 ? 32768 : 32767), true))
    return new Blob([buffer], { type: 'audio/wav' })
  } finally { await context.close() }
}

export default function VoiceInput({ lang, disabled, draft, onText, onBusy }: {
  lang: 'ar' | 'en'; disabled: boolean; draft: string; onText: (text: string) => void; onBusy: (busy: boolean) => void
}) {
  const ar = lang === 'ar', t = (a: string, e: string) => ar ? a : e
  const [state, setState] = useState<'idle' | 'recording' | 'processing'>('idle')
  const [seconds, setSeconds] = useState(0), [error, setError] = useState('')
  const recorder = useRef<MediaRecorder | null>(null), stream = useRef<MediaStream | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null), abort = useRef<AbortController | null>(null)
  const cancelled = useRef(false), alive = useRef(true), currentDraft = useRef(draft)
  currentDraft.current = draft
  const starting = useRef(false)
  function release() {
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null
    if (timer.current) { clearInterval(timer.current); timer.current = null }
  }
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false; cancelled.current = true; abort.current?.abort()
      if (recorder.current?.state === 'recording') recorder.current.stop()
      release()
    }
  }, [])
  function stop(cancel = false) {
    cancelled.current = cancel
    if (recorder.current?.state === 'recording') recorder.current.stop()
    release()
  }
  async function start() {
    if (starting.current || state !== 'idle' || disabled) return
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined' || !window.isSecureContext) {
      setError(t('التسجيل مش متاح في المتصفح ده. افتح الموقع في متصفح حديث عبر HTTPS أو اكتب سؤالك.', 'Recording is unavailable here. Open the HTTPS site in a modern browser or type your question.')); return
    }
    starting.current = true; cancelled.current = false; setError(''); onBusy(true)
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!alive.current) { media.getTracks().forEach(track => track.stop()); return }
      stream.current = media
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type))
      const recording = new MediaRecorder(media, mime ? { mimeType: mime } : undefined)
      recorder.current = recording
      const chunks: Blob[] = []
      recording.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      recording.onstop = async () => {
        release()
        if (!alive.current) return
        if (cancelled.current) { setState('idle'); onBusy(false); return }
        setState('processing')
        try {
          const wav = await toWav(new Blob(chunks, { type: recording.mimeType }))
          if (!alive.current || cancelled.current) return
          abort.current = new AbortController()
          const res = await fetch('/assistant/transcribe', { method: 'POST', headers: { 'Content-Type': 'audio/wav', 'X-Voice-Language': lang }, body: wav, signal: abort.current.signal })
          const body = await res.json()
          if (!res.ok) throw new Error(body.error || t('تعذّر تحويل الصوت.', 'Transcription failed.'))
          if (typeof body.text !== 'string' || !body.text.trim()) throw new Error(t('لم نلتقط كلامًا واضحًا.', 'No clear speech detected.'))
          if ((currentDraft.current + ' ' + body.text).trim().length > 1500) throw new Error(t('النص مع المسودة أطول من ١٥٠٠ حرف؛ قلّل المسودة وحاول مجددًا.', 'The recording and draft exceed 1500 characters. Shorten the draft and try again.'))
          if (alive.current) onText(body.text)
        } catch (e) {
          if (alive.current && !cancelled.current) setError(e instanceof Error && e.message !== 'duration' ? e.message : t('تعذّر قراءة التسجيل. جرّب تسجيلًا أقصر أو اكتب سؤالك.', 'Could not read the recording. Try a shorter recording or type your question.'))
        } finally { if (alive.current) { setState('idle'); onBusy(false) } }
      }
      recording.onerror = () => { cancelled.current = true; stop(true); if (alive.current) { setError(t('التسجيل توقف. حاول مرة أخرى.', 'Recording stopped. Please try again.')); setState('idle'); onBusy(false) } }
      recording.start(); setState('recording'); setSeconds(0)
      let elapsed = 0
      timer.current = setInterval(() => { elapsed++; setSeconds(elapsed); if (elapsed >= 30) stop() }, 1000)
    } catch {
      release(); if (alive.current) { setError(t('اسمح باستخدام الميكروفون من إعدادات المتصفح، أو اكتب سؤالك.', 'Allow microphone access in your browser settings, or type your question.')); setState('idle'); onBusy(false) }
    } finally { starting.current = false }
  }
  return <div className="flex flex-col gap-2">
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={disabled || state === 'processing'} onClick={() => state === 'recording' ? stop() : void start()} aria-pressed={state === 'recording'}
        className="rounded-lg border border-surface-variant p-2 flex items-center gap-2 text-on-surface disabled:opacity-50">
        {state === 'recording' ? <Square size={16} /> : <Mic size={16} />}
        {state === 'processing' ? t('بنحوّل الصوت لنص…', 'Transcribing…') : state === 'recording' ? `${t('إيقاف ومراجعة', 'Stop and review')} · ${seconds}/30` : t('سجّل سؤالك بالصوت', 'Record your question')}
      </button>
      {state === 'recording' && <button type="button" onClick={() => stop(true)} className="p-2 underline flex gap-1 items-center"><X size={14} />{t('إلغاء', 'Cancel')}</button>}
    </div>
    <p className="text-xs text-on-surface-variant">{t('٣٠ ثانية بحد أقصى. يُرسل التسجيل إلى Gemini لتحويله لنص، ولا نحفظه في التطبيق. راجع النص قبل الإرسال. التحويل يستخدم طلبًا من حصة المساعد.', 'Up to 30 seconds. Audio goes to Gemini for transcription and is not stored by this app. Review the text before sending. Transcription uses one assistant allowance request.')}</p>
    {error && <p role="alert" className="text-xs text-error">{error}</p>}
  </div>
}
