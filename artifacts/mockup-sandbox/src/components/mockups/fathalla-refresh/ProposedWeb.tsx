import { useState } from 'react'
import { Barcode, HeartPulse, Info, Sparkles } from 'lucide-react'
import './_refresh.css'
import { Assistant, Header, ProductList, type RefreshLang } from './_RefreshParts'

export function ProposedWeb() {
  const [lang, setLang] = useState<RefreshLang>('ar')
  const [dark, setDark] = useState(false)
  const [screening, setScreening] = useState(false)
  const [category, setCategory] = useState('الكل')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState(0)
  const [toast, setToast] = useState('')
  const ar = lang === 'ar'
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400) }
  const catChange = (value:string) => setCategory(value)
  return <div className={`fh-refresh ${dark ? 'fh-dark' : ''}`} dir={ar ? 'rtl' : 'ltr'} lang={lang}>
    <Header lang={lang} setLang={v=>{setLang(v);setCategory(v==='ar'?'الكل':'All')}} dark={dark} setDark={setDark} cart={cart} query={query} setQuery={setQuery}/>
    <main className="fh-shell fh-page">
      <section className="fh-welcome">
        <div>
          <div className="fh-eyebrow"><Sparkles size={15}/>{ar ? 'رفيق التسوّق اليومي' : 'Your everyday shopping companion'}</div>
          <h1>{ar ? 'اختيارات أهدأ، ومعلومات أوضح.' : 'Shop with more context, less noise.'}</h1>
          <p>{ar ? 'تعرّف على معلومات الملصق وما لفت انتباهنا — ثم اختر ما يناسبك.' : 'See what a label tells us and what caught our attention—then choose what works for you.'}</p>
        </div>
        <div className="fh-quick-actions">
          <button className="fh-button fh-primary" onClick={()=>notify(ar?'معاينة فقط — ماسح الباركود غير متصل':'Preview only — scanner is not connected')}><Barcode size={17}/>{ar?'امسح منتجاً':'Scan a product'}</button>
          <button className="fh-button fh-secondary" onClick={()=>notify(ar?'الملف الصحي غير متاح في هذه المعاينة':'Health profile is unavailable in this preview')}><HeartPulse size={17}/>{ar?'إعداد الفحص':'Screening setup'}</button>
        </div>
      </section>
      <div className="fh-layout">
        <section className="fh-maincol">
          <div className="fh-card fh-filterbar">
            <div className="fh-filter-top">
              <span style={{fontSize:12,color:'var(--fh-muted)',fontWeight:700}}>{ar?'اختر فئة من السوق':'Choose a market category'}</span>
              <div className="fh-switchrow"><span>{ar?'اعرض الخيارات الأقل تأثيراً':'Show lower-impact options'}</span><button className={`fh-switch ${screening?'on':''}`} role="switch" aria-checked={screening} onClick={()=>setScreening(!screening)}><span/></button></div>
            </div>
            <div className="fh-note"><Info size={14}/><span>{screening ? (ar?'تصفية توضيحية للأمثلة؛ لا تؤكد ملاءمة الطعام لحالتك.':'Illustrative filter only; it does not confirm suitability for your condition.') : (ar?'ملاحظاتنا إرشادية وتعتمد على البيانات المتاحة. لا تظهر القيمة المجهولة كأنها صفر.':'Notes are guidance based on available data. Unknown values are never shown as zero.')}</span></div>
          </div>
          <ProductList lang={lang} active={category} query={query} screening={screening} onCategory={catChange} onAdd={()=>{setCart(cart+1);notify(ar?'أُضيف المثال إلى سلة المعاينة':'Added to the demo basket')}}/>
          <div className="fh-card fh-bottom-info"><strong>{ar?'كيف نعرض الملاحظات؟':'How to read these notes'}</strong><span>{ar?'المعلومات المعروضة توضيحية وتعتمد على الملصق لكل حصة. الفحص لا يشخّص ولا يضمن الأمان. عند نقص البيانات، راجع العبوة أو اسأل مختصك.':'Illustrative label information is per serving. Screening does not diagnose or guarantee safety. If information is missing, check the package or ask your clinician.'}</span></div>
        </section>
        <aside className="fh-aside"><Assistant lang={lang}/></aside>
      </div>
    </main>
    {toast && <div className="fh-toast" role="status">{toast}</div>}
  </div>
}

export default ProposedWeb
