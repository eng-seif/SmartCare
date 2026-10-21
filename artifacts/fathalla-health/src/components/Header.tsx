'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'
import BrandLogo from './BrandLogo'
import ThemeToggle from './ThemeToggle'
import LangToggle from './LangToggle'


    export type HeaderUser = { name: string; email: string } | null

    export default function Header({ cartCount = 0, user = null, lang = 'en' }: { cartCount?: number; user?: HeaderUser; lang?: 'en' | 'ar' }) {
      const currentPath = usePathname();

      const navItems = [
        { label: "Healthy Market", path: "/" },
        { label: "Barcode Scanner", path: "/scanner" },
        { label: "Health Profile & Smart Cart", path: "/cart" }
      ];

      return (
        <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(17,24,39,0.04)]">
          <div className="h-20 w-full max-w-[1440px] mx-auto px-3 sm:px-4 md:px-margin-desktop flex items-center justify-between gap-2 sm:gap-space-lg">
            <Link href="/" aria-label="Fathalla Healthy Market" className="flex items-center gap-space-sm shrink-0">
              <BrandLogo size={40} />
              <div className="hidden min-[400px]:flex flex-col">
                <span className="font-title-lg text-title-lg text-on-surface tracking-tight leading-none">Fathalla</span>
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider font-semibold">Healthy Market</span>
              </div>
            </Link>

            <div className="flex-1 max-w-md hidden xl:block">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-space-md text-secondary text-lg pointer-events-none">search</span>
                <input 
                  className="w-full h-11 pl-11 pr-space-md bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-all" 
                  placeholder="Search groceries, GI score, zero sugar..." 
                  type="text"
                />
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-space-xs">
              {navItems.map(item => {
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`px-space-md py-space-sm rounded-lg font-title-md text-title-md transition-colors ${
                      isActive 
                        ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm' 
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-0.5 sm:gap-space-md min-w-0">
              <LangToggle lang={lang} />
              <ThemeToggle />
              <Link href="/cart" aria-label="Cart" className="relative p-space-sm rounded-lg text-on-surface hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-2xl">shopping_basket</span>
                <span className="absolute top-1 end-1 w-4 h-4 rounded-full bg-primary-container text-white font-label-sm text-[10px] flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              </Link>

              <AccountMenu user={user} />
            </div>
          </div>
        </header>
      );
    }



function AccountMenu({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key) }
  }, [open])
  if (!user) return (
    <Link href="/register" className="px-space-sm sm:px-space-md py-space-sm rounded-lg bg-primary-container text-white font-title-md text-title-md whitespace-nowrap text-sm sm:text-base">Sign in<span className="hidden sm:inline"> / Register</span></Link>
  )
  async function signOut() {
    await supabaseBrowser().auth.signOut()
    window.location.assign('/')
  }
  const row = 'w-full text-start px-space-sm py-space-sm rounded-lg font-title-md text-title-md hover:bg-surface-container-low flex items-center gap-space-sm'
  return (
    <div className="relative shrink-0" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} aria-label="Account menu" aria-expanded={open} aria-haspopup="menu"
        className="w-9 h-9 rounded-full bg-primary-container text-white font-bold ring-2 ring-primary/20">{(user.name || user.email)[0].toUpperCase()}</button>
      {open && (
        <div className="fixed end-2 top-[4.5rem] sm:absolute sm:end-0 sm:top-full sm:mt-2 w-60 max-w-[calc(100vw-1rem)] max-h-[calc(100dvh-6rem)] overflow-y-auto bg-surface-container-lowest rounded-xl shadow-xl border border-surface-variant/60 p-space-sm flex flex-col z-50">
          <div className="px-space-sm pb-space-sm mb-space-xs border-b border-surface-variant/60">
            <p className="font-title-md text-title-md text-on-surface truncate">{user.name || user.email}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{user.email}</p>
          </div>
          <Link href="/profile" onClick={() => setOpen(false)} className={row}><span className="material-symbols-outlined text-xl">manage_accounts</span>Edit profile</Link>
          <button type="button" onClick={signOut} className={`${row} text-error`}><span className="material-symbols-outlined text-xl">logout</span>Sign out</button>
        </div>
      )}
    </div>
  )
}
