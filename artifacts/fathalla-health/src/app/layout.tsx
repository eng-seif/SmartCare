import './globals.css'
import './market-refresh.css'
import { Inter, JetBrains_Mono, Cairo } from 'next/font/google'
import { cookies } from 'next/headers'
import Translator from '@/components/Translator'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MobileNav from '../components/MobileNav'
import LiveRefresh from '@/components/LiveRefresh'
import { supabaseServer } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400', '500', '600', '700'] })
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo', weight: ['400', '500', '600', '700'] })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-jb', weight: ['600', '700'] })
export const metadata = { title: 'Fathalla Healthy Market - Clinical Glycemic Nutrition' }

const THEME_SCRIPT = "(function(){var d=document.documentElement,m=document.cookie.match(/(?:^|; )theme=(light|dark)/),t=m&&m[1];if(!t){try{t=localStorage.getItem('theme')}catch(e){}}if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';d.setAttribute('data-theme',t);d.style.colorScheme=t})()"

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang: 'en' | 'ar' = (await cookies()).get('lang')?.value === 'ar' ? 'ar' : 'en'
  const themeCookie = (await cookies()).get('theme')?.value
  let user: { id: string; email?: string | null } | null = null
  let prof: { full_name?: string | null } | null = null
  let cart: { qty: number }[] | null = []
  if (isSupabaseConfigured()) {
      const sb = await supabaseServer()
      user = (await sb.auth.getUser()).data.user
      if (user) {
        prof = (await sb.from('profiles').select('full_name').eq('id', user.id).maybeSingle()).data
        cart = (await sb.from('cart_items').select('qty')).data
      }
  }
  const cartCount = (cart ?? []).reduce((s: number, r: { qty: number }) => s + r.qty, 0)
  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`${inter.variable} ${mono.variable} ${cairo.variable}`} suppressHydrationWarning data-theme={themeCookie === 'dark' || themeCookie === 'light' ? themeCookie : undefined}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" precedence="default" />
      </head>
      <body className="bg-surface font-body-md text-body-md text-on-surface antialiased">
        {/* Parser-executed scripts stay in the body, away from preview-injected head scripts. */}
        <script id="fathalla-theme-init" dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {lang === 'ar' && <style dangerouslySetInnerHTML={{ __html: 'body{opacity:0}' }} />}
        {lang === 'ar' && <script id="fathalla-language-reveal" dangerouslySetInnerHTML={{ __html: 'setTimeout(function(){document.body&&(document.body.style.opacity=1)},2500)' }} />}
        <Translator lang={lang} />
        <div className="fh-refresh min-h-[100dvh] flex flex-col bg-surface">
          {user && <LiveRefresh userId={user.id} />}
          <Header lang={lang} cartCount={cartCount} user={user ? { name: prof?.full_name ?? '', email: user.email ?? '' } : null} />
          <main className="w-full pt-20 pb-16 lg:pb-0 bg-surface flex-1">{children}</main>
          <Footer />
          <MobileNav cartCount={cartCount} loggedIn={!!user} />
        </div>
      </body>
    </html>
  )
}
