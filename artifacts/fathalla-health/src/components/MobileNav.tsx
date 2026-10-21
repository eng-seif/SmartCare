'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav({ cartCount, loggedIn }: { cartCount: number; loggedIn: boolean }) {
  const path = usePathname() ?? '/'
  const tabs = [
    { href: '/', label: 'Market', icon: 'storefront' },
    { href: '/scanner', label: 'Scan', icon: 'qr_code_scanner' },
    { href: '/cart', label: 'Cart', icon: 'shopping_basket', badge: cartCount },
    { href: loggedIn ? '/profile' : '/register', label: loggedIn ? 'Profile' : 'Sign in', icon: 'person' },
  ]
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-variant/60 pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-4">
        {tabs.map(t => {
          const active = t.href === '/' ? path === '/' : path.startsWith(t.href)
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
