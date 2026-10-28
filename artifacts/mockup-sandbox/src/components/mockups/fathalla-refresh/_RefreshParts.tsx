import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Apple, Info, MessageCircle, Moon, Search, Send, ShoppingBasket, ShoppingCart, Sparkles, Sun, Wheat } from 'lucide-react'
import logo from './_shared/assets/logo.webp'

export type RefreshLang = 'ar' | 'en'
export type DemoProduct = { id: number; ar: string; en: string; catAr: string; catEn: string; detailsAr: string; detailsEn: string; price: string; badge: 'good' | 'caution' | 'missing'; reasonAr: string; reasonEn: string; art: string; bg: string; light: string; icon: typeof Apple }

export const demoProducts: DemoProduct[] = [
  { id: 1, ar: 'زبادي طبيعي', en: 'Plain yoghurt', catAr: 'ألبان', catEn: 'Dairy', detailsAr: 'عبوة ٤٠٠ جم', detailsEn: '400 g tub', price: '٣٨', badge: 'good', reasonAr: 'بيانات الملصق متاحة للفحص الأولي', reasonEn: 'Label data available for an initial screen', art: '#c8dcae', bg: '#e7f0df', light: '#fbfff2', icon: Apple },
  { id: 2, ar: 'شوفان كامل', en: 'Whole oats', catAr: 'حبوب', catEn: 'Grains', detailsAr: 'عبوة ٥٠٠ جم', detailsEn: '500 g pack', price: '٥٢', badge: 'caution', reasonAr: 'الكمية لكل حصة مهمة عند المقارنة', reasonEn: 'Serving size matters when comparing', art: '#bda375', bg: '#eee8d9', light: '#fff9ea', icon: Wheat },
  { id: 3, ar: 'فول مدمس', en: 'Fava beans', catAr: 'معلبات', catEn: 'Canned', detailsAr: 'علبة ٤٠٠ جم', detailsEn: '400 g tin', price: '٢٤', badge: 'missing', reasonAr: 'بيانات الصوديوم غير متاحة — راجع العبوة', reasonEn: 'Sodium is not listed — check the pack', art: '#b6bb77', bg: '#edf0d9', light: '#fbfce9', icon: Apple },
  { id: 4, ar: 'خبز حبوب كاملة', en: 'Wholegrain bread', catAr: 'مخبوزات', catEn: 'Bakery', detailsAr: 'عبوة ٦ شرائح', detailsEn: '6 slices', price: '٣٤', badge: 'caution', reasonAr: 'قارن الكربوهيدرات وحجم الحصة', reasonEn: 'Compare carbs and serving size', art: '#bf8a5c', bg: '#f2e5d7', light: '#fff6ec', icon: Wheat },
]

export function Logo() {
  return <span className="fh-logo"><img src={logo} alt="فتح الله" /></span>
}

export function Header({ lang, setLang, dark, setDark, cart, mobile = false, query = '', setQuery = () => {} }: { lang: RefreshLang; setLang: (v: RefreshLang) => void; dark: boolean; setDark: (v: boolean) => void; cart: number; mobile?: boolean; query?: string; setQuery?: (v:string)=>void }) {
  const ar = lang === 'ar'
  return mobile ? <>
    <div className="fh-mobile-status" dir="ltr"><span>9:41</span><span>● ▮▮  Wi-Fi</span></div>
    <header className="fh-mobile-header">
      <div className="fh-brand"><Logo/><div><div className="fh-brandname">{ar ? 'فتح الله' : 'Fathalla'}</div><div className="fh-brand-sub">{ar ? 'اختيارات أذكى كل يوم' : 'A little more informed'}</div></div></div>
      <div className="fh-mobile-controls">
        <button className="fh-iconbutton fh-lang" aria-label="Switch language" onClick={() => setLang(ar ? 'en' : 'ar')}>{ar ? 'EN' : 'عربي'}</button>
        <button className="fh-iconbutton" aria-label={ar ? 'تغيير المظهر' : 'Toggle theme'} onClick={() => setDark(!dark)}>{dark ? <Sun size={17}/> : <Moon size={17}/>}</button>
        <button className="fh-iconbutton" aria-label={ar ? 'السلة' : 'Cart'}><ShoppingBasket size={17}/></button>
      </div>
    </header>
  </> : <header className="fh-topbar"><div className="fh-shell fh-top-inner">
    <div className="fh-brand"><Logo/><div><div className="fh-brandname">{ar ? 'فتح الله' : 'Fathalla'}</div><div className="fh-brand-sub">{ar ? 'سوق يهتم باختياراتك' : 'A market for mindful choices'}</div></div></div>
    <div className="fh-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={ar ? 'ابحث عن منتج أو عنصر غذائي' : 'Search products or nutrients'} /></div>
    <nav className="fh-nav"><button className="fh-navbutton active">{ar ? 'السوق' : 'Market'}</button><button className="fh-navbutton">{ar ? 'الماسح' : 'Scanner'}</button><button className="fh-navbutton">{ar ? 'اختياراتي' : 'My choices'}</button></nav>
    <div className="fh-actions"><button className="fh-iconbutton fh-lang" onClick={() => setLang(ar ? 'en' : 'ar')}>{ar ? 'EN' : 'عربي'}</button><button className="fh-iconbutton" onClick={() => setDark(!dark)} aria-label="Toggle dark mode">{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="fh-iconbutton" aria-label="Shopping basket"><ShoppingBasket size={18}/><sup>{cart}</sup></button></div>
  </div></header>
}

export function ProductList({ lang, active, query, mobile = false, screening = false, onAdd, onCategory }: { lang: RefreshLang; active: string; query: string; mobile?: boolean; screening?: boolean; onAdd: () => void; onCategory: (value: string) => void }) {
  const ar = lang === 'ar'
  const categories = ar ? ['الكل', 'ألبان', 'حبوب', 'معلبات', 'مخبوزات'] : ['All', 'Dairy', 'Grains', 'Canned', 'Bakery']
  const filtered = useMemo(() => demoProducts.filter(p => (!screening || p.badge === 'good') && (active === categories[0] || (ar ? p.catAr : p.catEn) === active) && `${ar ? p.ar : p.en} ${ar ? p.catAr : p.catEn}`.toLowerCase().includes(query.toLowerCase())), [active, ar, categories, query, screening])
  const labels = ar ? { good: 'معلومات متاحة', caution: 'انتبه للحصة', missing: 'بيانات ناقصة' } : { good: 'Info available', caution: 'Check serving', missing: 'Data missing' }
  return <>
    <div className={mobile ? 'fh-mobile-category' : ''}>
      <div className="fh-sectionhead"><div><h2>{ar ? 'اختيارات من السوق' : 'A few market picks'}</h2><p>{ar ? 'افهم سبب الملاحظة قبل أن تقرر.' : 'See what prompted a note, then decide.'}</p></div><span className="fh-sample">{ar ? 'أمثلة تصميمية • ليست من كتالوج حي' : 'Design examples · not a live catalog'}</span></div>
      <div className="fh-cats">{categories.map(c => <button key={c} className={active === c ? 'active' : ''} onClick={() => onCategory(c)}>{c}</button>)}</div>
    </div>
    <div className={mobile ? 'fh-mobile-productlist' : 'fh-grid'} style={{ marginTop: 12 }}>
      {filtered.length ? filtered.map(p => {
        const Icon = p.icon
        return <article className={`fh-card fh-product ${mobile ? 'fh-mobile-product' : ''}`} key={p.id}>
          <div className="fh-product-visual" style={{ '--art-color': p.art, '--art-bg': p.bg, '--art-light': p.light } as CSSProperties}><div className="fh-food-shape" aria-hidden="true"></div></div>
          <div className="fh-product-info">
            <div className="fh-product-title"><div><h3>{ar ? p.ar : p.en}</h3><div className="fh-product-detail">{ar ? p.detailsAr : p.detailsEn} · {ar ? p.catAr : p.catEn}</div></div><span className={`fh-status ${p.badge}`}>{labels[p.badge]}</span></div>
            <div className="fh-why"><Icon size={13} /> <span>{ar ? p.reasonAr : p.reasonEn}</span></div>
            <div className="fh-product-foot"><div className="fh-price">{p.price} <small>{ar ? 'ج.م' : 'EGP'}</small></div><button className="fh-add" onClick={onAdd}><ShoppingCart size={13}/>{ar ? 'للسلة' : 'Add'}</button></div>
          </div>
        </article>
      }) : <div className="fh-empty">{ar ? 'لا توجد أمثلة مطابقة. جرّب فئة أخرى.' : 'No matching examples. Try another category.'}</div>}
    </div>
  </>
}

export function Assistant({ lang, mobile = false }: { lang: RefreshLang; mobile?: boolean }) {
  const ar = lang === 'ar'
  const [input, setInput] = useState('')
  const [sent, setSent] = useState<string[]>([])
  const [reply, setReply] = useState(false)
  const suggested = ar ? ['ما معنى مؤشر السكر؟', 'كيف أقرأ كمية الحصة؟'] : ['What is glycemic index?', 'How do I read serving size?']
  const send = (text: string) => { if (!text.trim()) return; setSent([...sent, text.trim()]); setInput(''); setReply(true) }
  return <section className={`fh-card fh-chat ${mobile ? 'fh-mobile-chat' : ''}`} aria-label={ar ? 'مساعد التغذية' : 'Nutrition assistant'}>
    <div className="fh-chat-head"><div className="fh-chat-mark"><MessageCircle size={19}/></div><div><h2>{ar ? 'اسأل مساعد التغذية' : 'Ask the food guide'}</h2><p>{ar ? 'إرشاد عام، بلغة بسيطة' : 'Plain-language general guidance'}</p></div><Sparkles size={15} style={{ marginInlineStart:'auto',color:'var(--fh-teal)' }}/></div>
    {!sent.length ? <div className="fh-chat-demo">{ar ? 'أقدر أساعدك تفهم الملصق وتقارن بين المنتجات. الاختيار لك دائماً، والبيانات المتاحة قد تكون غير مكتملة.' : 'I can help you understand a label and compare products. The choice is always yours, and available data may be incomplete.'}</div> : <div className="fh-chat-log" role="log" aria-live="polite">
      {sent.map((m,i)=><div key={i} className="fh-chat-msg user">{m}</div>)}
      {reply && <div className="fh-chat-msg">{ar ? 'هذه معاينة تصميمية فقط؛ لم يتم إرسال سؤالك إلى أي خدمة. في التطبيق الفعلي يمكن للمساعد شرح الملصق دون تشخيص أو ضمان ملاءمة طعام لحالتك.' : 'This is a design preview only; your question was not sent anywhere. In a real app, an assistant could explain a label without diagnosing or guaranteeing suitability.'}</div>}
    </div>}
    {!sent.length && <div className="fh-chat-suggest">{suggested.map(s=><button key={s} onClick={() => send(s)}>{s}</button>)}</div>}
    <form className="fh-chat-form" onSubmit={e => { e.preventDefault(); send(input) }}><input value={input} onChange={e=>setInput(e.target.value)} placeholder={ar ? 'اكتب سؤالك هنا' : 'Ask about a food label'} aria-label={ar ? 'سؤالك' : 'Your question'} /><button aria-label={ar ? 'إرسال' : 'Send'}><Send size={15}/></button></form>
    <div className="fh-disclaimer"><Info size={13} />{ar ? 'معاينة بلا ذكاء اصطناعي أو بيانات شخصية. الإرشاد ليس تشخيصاً طبياً.' : 'Demo only: no AI or personal data. Guidance is not a medical diagnosis.'}</div>
  </section>
}

