import { useState, type AnchorHTMLAttributes } from 'react'

export function Link({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} href={href} onClick={e => e.preventDefault()}>{children}</a>
}
export const usePathname = () => '/'
export const useRouter = () => ({ push: (_path: string) => {}, refresh: () => {} })
export const supabaseBrowser = () => ({
  auth: { getUser: async () => ({ data: { user: null as { id: string } | null } }), signOut: async () => {} },
  from: (_table: string) => ({
    select: (_fields: string) => ({ eq: (_field: string, _id: string) => ({ maybeSingle: async () => ({ data: { qty: 0 } }) }) }),
    upsert: async (_value: unknown, _options: unknown) => ({ error: null as { message: string } | null }),
  }),
})
export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  return <button aria-label="Toggle dark mode" className="p-space-sm" onClick={() => {
    setDark(!dark); document.documentElement.dataset.theme = dark ? 'light' : 'dark'
  }}><span className="material-symbols-outlined">{dark ? 'light_mode' : 'dark_mode'}</span></button>
}
export function LangToggle({ lang }: { lang: 'en' | 'ar' }) {
  return <button className="p-space-sm rounded-lg border border-surface-variant">{lang === 'ar' ? 'English' : 'عربي'}</button>
}
