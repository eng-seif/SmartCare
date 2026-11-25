import type { Verdict } from '@/lib/health'

export const TONE = {
  safe: {
    chip: 'bg-tertiary-fixed text-on-tertiary-fixed',
    text: 'text-tertiary',
    soft: 'bg-tertiary-fixed/30',
    dot: 'bg-tertiary',
    label: 'Safe match',
    labelAr: 'مناسب لك',
    title: 'No flags under the selected screening rules',
    titleAr: 'لا توجد ملاحظات تحت قواعد الفحص الحالية',
  },
  caution: {
    chip: 'bg-primary-fixed text-on-primary-fixed-variant',
    text: 'text-primary',
    soft: 'bg-primary-fixed/50',
    dot: 'bg-primary',
    label: 'Use Caution',
    labelAr: 'انتبه للحصة',
    title: 'Caution Recommended',
    titleAr: 'يُفضّل الانتباه للحصة',
  },
  avoid: {
    chip: 'bg-error-container text-on-error-container',
    text: 'text-error',
    soft: 'bg-error-container/60',
    dot: 'bg-error',
    label: 'Not Recommended',
    labelAr: 'غير مناسب',
    title: 'Not Recommended for Your Condition',
    titleAr: 'غير موصى به لحالتك الصحية',
  },
} as const

export default function HealthBadge({ verdict, lang = 'en' }: { verdict: Verdict; lang?: 'en' | 'ar' }) {
  const t = TONE[verdict]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-label-sm text-label-sm font-semibold whitespace-nowrap ${t.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.dot}`}></span>
      {lang === 'ar' ? t.labelAr : t.label}
    </span>
  )
}
