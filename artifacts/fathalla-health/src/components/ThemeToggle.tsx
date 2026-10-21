'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => { setDark(document.documentElement.dataset.theme === 'dark') }, [])
  function toggle() {
    const next = dark ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    document.documentElement.style.colorScheme = next
    try { localStorage.setItem('theme', next) } catch {}
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`
    setDark(!dark)
  }
  return (
    <button type="button" onClick={toggle} aria-pressed={dark} aria-label="Toggle dark mode" data-no-translate
      className="p-space-sm rounded-lg text-on-surface hover:bg-surface-container-low transition-colors shrink-0">
      <span className="material-symbols-outlined text-2xl theme-icon-light">dark_mode</span>
      <span className="material-symbols-outlined text-2xl theme-icon-dark">light_mode</span>
    </button>
  )
}
