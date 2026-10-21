'use client'
export default function LangToggle({ lang }: { lang: 'en' | 'ar' }) {
  function toggle() {
    document.cookie = `lang=${lang === 'ar' ? 'en' : 'ar'}; path=/; max-age=31536000; samesite=lax`
    window.location.reload()
  }
  return (
    <button type="button" onClick={toggle} data-no-translate aria-label="Toggle language"
      className="flex items-center gap-1 px-2 sm:px-space-sm py-space-xs text-sm sm:text-base rounded-lg border border-surface-variant/60 bg-surface-container-lowest hover:bg-surface-container-low font-title-md text-title-md whitespace-nowrap">
      <span className="hidden sm:inline"><span className="material-symbols-outlined text-xl">translate</span></span>
      <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
    </button>
  )
}
