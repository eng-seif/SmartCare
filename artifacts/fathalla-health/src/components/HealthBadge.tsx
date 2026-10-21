import type { Verdict } from '@/lib/health'
export const TONE = {
  safe: { chip: 'bg-tertiary-fixed text-on-tertiary-fixed', text: 'text-tertiary', soft: 'bg-tertiary-fixed/30', dot: 'bg-tertiary', label: 'Within screening rules', title: 'No flags under the selected screening rules' },
  caution: { chip: 'bg-primary-fixed text-on-primary-fixed-variant', text: 'text-primary', soft: 'bg-primary-fixed/50', dot: 'bg-primary', label: 'Use Caution', title: 'Caution Recommended' },
  avoid: { chip: 'bg-error-container text-on-error-container', text: 'text-error', soft: 'bg-error-container/60', dot: 'bg-error', label: 'Not Recommended', title: 'Not Recommended for Your Condition' },
} as const
export default function HealthBadge({ verdict }: { verdict: Verdict }) {
  const t = TONE[verdict]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold ${t.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`}></span>{t.label}
    </span>
  )
}
