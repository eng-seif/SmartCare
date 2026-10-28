import { useState } from 'react'
import { Barcode, HeartPulse, Home, MessageCircle, Search, ShoppingBasket, Sparkles, UserRound } from 'lucide-react'
import './_refresh.css'
import { Assistant, Header, ProductList, type RefreshLang } from './_RefreshParts'

export function ProposedMobile() {
  const [lang, setLang] = useState<RefreshLang>('ar')
  const [dark, setDark] = useState(false)
  const [category, setCategory] = useState('الكل')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState(0)
  const [toast, setToast] = useState('')
  const [tab, setTab] = useState('home')
  const ar = lang === 'ar'
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400) }
  const switchLang = (value: RefreshLang) => { setLang(value); setCategory(value === 'ar' ? 'الكل' : 'All') }
  return <div className={`fh-refresh fh-mobile ${dark ? 'fh-dark' : ''}`} dir={ar ? 'rtl' : 'ltr'} lang={lang}>
    <Header mobile lang={lang} setLang={switchLang} dark={dark} setDark={setDark} cart={cart}/>
    <main className="fh-mobile-main">
      <section className="fh-mobile-greeting">
        <div className="fh-eyebrow"><Sparkles size={13}/>{ar ? 'تسوّق على طريقتك' : 'A more considered shop'}</div>
        <h1>{ar ? 'كل معلومة تساعدك تختار.' : 'Every label, a little clearer.'}</h1>
        <p>{ar ? 'اكتشف المنتجات وافهم الملاحظات ببساطة.' : 'Browse groceries and make sense of label notes.'}</p>
      </section>
      <div className="fh-mobile-quick">
        <button className="fh-button fh-primary" onClick={()=>notify(ar?'ماسح الباركود للمعاينة فقط':'Scanner preview only')}><Barcode size={16}/>{ar?'امسح باركوداً':'Scan barcode'}</button>
        <button className="fh-button fh-secondary" onClick={()=>notify(ar?'إعداد الفحص غير متاح في المعاينة':'Screening setup is a preview only')}><HeartPulse size={16}/>{ar?'خيارات الفحص':'Screening'}</button>
      </div>
      <div className="fh-mobile-search"><div className="fh-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={ar?'ابحث عن منتج أو مكوّن':'Search products or ingredients'}/></div></div>
      <Assistant lang={lang} mobile/>
      <ProductList lang={lang} active={category} query={query} mobile onCategory={setCategory} onAdd={()=>{setCart(cart+1);notify(ar?'أُضيف المثال إلى سلة المعاينة':'Added to the demo basket')}}/>
      <div className="fh-note" style={{marginTop:16}}><span>{ar?'الأمثلة والأسعار للعرض التصميمي فقط، وليست من كتالوج حي. المعلومات الناقصة ليست صفراً.':'Products and prices are design examples, not a live catalog. Missing data is not zero.'}</span></div>
    </main>
    <nav className="fh-bottomnav" aria-label={ar?'التنقل الرئيسي':'Main navigation'}>
      <button className={tab==='home'?'active':''} onClick={()=>setTab('home')}><Home size={18}/>{ar?'السوق':'Market'}</button>
      <button className={tab==='scan'?'active':''} onClick={()=>{setTab('scan');notify(ar?'الماسح في المعاينة فقط':'Scanner is a preview only')}}><Barcode size={18}/>{ar?'امسح':'Scan'}</button>
      <button className={tab==='assistant'?'active':''} onClick={()=>{setTab('assistant');document.querySelector('.fh-mobile-chat')?.scrollIntoView({behavior:'smooth',block:'center'})}}><MessageCircle size={18}/>{ar?'اسأل':'Ask'}</button>
      <button className={tab==='basket'?'active':''} onClick={()=>{setTab('basket');notify(ar?`السلة التجريبية: ${cart} عناصر`:`Demo basket: ${cart} items`)}}><ShoppingBasket size={18}/>{ar?'السلة':'Basket'}</button>
      <button className={tab==='profile'?'active':''} onClick={()=>{setTab('profile');notify(ar?'الملف غير متاح في هذه المعاينة':'Profile is unavailable in this preview')}}><UserRound size={18}/>{ar?'حسابي':'Profile'}</button>
    </nav>
    {toast && <div className="fh-toast" role="status">{toast}</div>}
  </div>
}

export default ProposedMobile
