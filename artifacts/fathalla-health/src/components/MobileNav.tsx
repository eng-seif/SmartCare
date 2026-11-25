'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function MobileNav({ cartCount, loggedIn }: { cartCount: number; loggedIn: boolean }) {
  const path = usePathname() ?? '/'
  const [lang, setLang] = useState<'ar' | 'en'>('en')
  const [badgeCount, setBadgeCount] = useState(cartCount)
  useEffect(() => { setLang(document.documentElement.lang === 'ar' ? 'ar' : 'en') }, [path])
  useEffect(() => { setBadgeCount(cartCount) }, [cartCount])
  useEffect(() => {
    const onCartCount = (e: Event) => {
      const detail = (e as CustomEvent<{ count?: number; delta?: number }>).detail
      if (typeof detail?.count === 'number') setBadgeCount(Math.max(0, detail.count))
      else if (typeof detail?.delta === 'number') setBadgeCount(c => Math.max(0, c + detail.delta!))
    }
    window.addEventListener('fh-cart-count', onCartCount)
    return () => window.removeEventListener('fh-cart-count', onCartCount)
  }, [])
  const tabs = [
    { href: '/', label: lang === 'ar' ? 'السوق' : 'Market', icon: 'storefront' },
    { href: '/scanner', label: lang === 'ar' ? 'امسح' : 'Scan', icon: 'qr_code_scanner' },
    { href: '/#assistant', label: lang === 'ar' ? 'اسأل' : 'Ask', icon: 'forum' },
    { href: '/cart', label: lang === 'ar' ? 'السلة' : 'Basket', icon: 'shopping_basket', badge: badgeCount },
    { href: loggedIn ? '/profile' : '/register', label: loggedIn ? (lang === 'ar' ? 'حسابي' : 'Account') : (lang === 'ar' ? 'ادخل' : 'Sign in'), icon: 'person' },
  ]
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-variant/60 pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {tabs.map(t => {
          const active = t.href === '/' ? path === '/' : !t.href.includes('#') && path.startsWith(t.href)
          return (
            <li key={t.href}>
              <Link href={t.href} className={`relative flex flex-col items-center gap-0.5 py-2 ${active ? 'text-primary-container' : 'text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-2xl">{t.icon}</span>
                <span className="font-label-sm text-label-sm">{t.label}</span>
                {!!t.badge && <span className="absolute top-1 left-1/2 ms-2 min-w-4 h-4 px-1 rounded-full bg-primary-container text-white text-[10px] font-bold flex items-center justify-center">{t.badge}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
