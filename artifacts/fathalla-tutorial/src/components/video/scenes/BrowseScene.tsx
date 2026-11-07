import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { C, Phone, SceneShell, StepHead, TapRing } from './kit';

const PRODUCTS = [
  { t: 'زبادي لايت', p: '١٨٫٥٠', s: 'لا ملاحظات', bg: C.soft, fg: C.ink, art: '#e8dcc6' },
  { t: 'زبادي بالفراولة', p: '٢٢٫٧٥', s: 'انتبه للحصة', bg: C.amberBg, fg: C.amber, art: '#f0d3c8' },
  { t: 'زبادي يوناني', p: '٣٤٫٢٥', s: 'لا ملاحظات', bg: C.soft, fg: C.ink, art: '#dde0cf' },
];

export function BrowseScene() {
  const q = 'زبادي';
  const [n, setN] = useState(0);
  useEffect(() => {
    const ids = [...q].map((_, i) => window.setTimeout(() => setN(i + 1), 900 + i * 160));
    return () => ids.forEach(clearTimeout);
  }, []);
  return (
    <SceneShell>
      <StepHead n="٢" title="تصفّح وابحث" sub="اكتب اسم المنتج أو العنصر الغذائي، واختار الفئة اللي تهمك." />
      <Phone>
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: '1.6vh', padding: '1.4vh 1.8vh', fontSize: '2.1vh', minHeight: '5.4vh' }}>
          {n ? q.slice(0, n) : <span style={{ color: C.muted }}>ابحث عن منتج</span>}
          <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} style={{ color: C.copper }}>|</motion.span>
        </div>
        <div className="flex gap-[0.8vh] my-[1.6vh]">
          {['الكل', 'ألبان', 'مخبوزات', 'مشروبات'].map((c, i) => (
            <motion.div key={c} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, background: i === 1 ? C.ink : 'rgba(0,0,0,0)', color: i === 1 ? C.paper : C.muted }}
              transition={{ delay: 0.5 + i * 0.08, background: { delay: 2 } , color: { delay: 2 } }}
              style={{ border: `1px solid ${C.line}`, borderRadius: 99, padding: '0.6vh 1.4vh', fontSize: '1.6vh' }}>{c}</motion.div>
          ))}
        </div>
        <div className="flex flex-col gap-[1.2vh]">
          {PRODUCTS.map((p, i) => (
            <motion.div key={p.t} initial={{ x: -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 2.2 + i * 0.18, type: 'spring', stiffness: 110, damping: 16 }}
              className="flex" style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: '1.8vh', overflow: 'hidden', height: '15vh' }}>
              <div style={{ width: '11vh', background: p.art }} className="flex items-center justify-center">
                <div style={{ width: '5vh', height: '6vh', borderRadius: '1.8vh 1.8vh 1.2vh 1.2vh', background: C.paper, boxShadow: '0 1vh 1.4vh #493b2922' }} />
              </div>
              <div className="flex-1 p-[1.2vh] flex flex-col justify-between">
                <div className="flex justify-between items-start gap-1">
                  <div style={{ fontWeight: 700, fontSize: '1.9vh' }}>{p.t}</div>
                  <div style={{ background: p.bg, color: p.fg, fontSize: '1.3vh', fontWeight: 700, padding: '0.4vh 0.8vh', borderRadius: '0.8vh', whiteSpace: 'nowrap' }}>{p.s}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '2.1vh' }}>{p.p} <small style={{ fontSize: '1.3vh', color: C.muted }}>ج.م</small></div>
              </div>
            </motion.div>
          ))}
        </div>
      </Phone>
      <TapRing delay={4} x="30vw" y="44vh" />
    </SceneShell>
  );
}
