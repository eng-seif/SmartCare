import { motion } from 'framer-motion';
import { C, StepHead } from './kit';

const ROWS = [
  { k: 'سكر (من الملصق)', v: '١٤ جم', w: 0.82, flag: true },
  { k: 'صوديوم', v: '١٨٠ مجم', w: 0.36, flag: false },
  { k: 'دهون مشبعة', v: 'غير متاح', w: 0, flag: false },
];

export function LabelScene() {
  return (
    <SceneShell2 />
  );
}

function SceneShell2() {
  return (
    <motion.div dir="rtl" className="absolute inset-0" style={{ background: C.bg, fontFamily: 'Cairo, sans-serif', color: C.ink }}
      initial={{ clipPath: 'inset(0 0 0 100%)' }} animate={{ clipPath: 'inset(0 0 0 0%)' }} exit={{ opacity: 0, x: -80 }}
      transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}>
      <StepHead n="٣" title="افهم الملصق" sub="افتح أي منتج وشوف القيم من الملصق وسبب كل ملاحظة." />
      <motion.div className="absolute" style={{ left: '7vw', top: '12vh', width: '44vw', background: C.paper, border: `1px solid ${C.line}`, borderRadius: '3vh', padding: '4vh', boxShadow: '0 3vh 7vh #493b2918' }}
        initial={{ scale: 0.7, rotate: -4, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.3 }}>
        <div className="flex justify-between items-center">
          <div style={{ fontSize: '4.4vh', fontWeight: 900 }}>زبادي بالفراولة</div>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 3, type: 'spring' }}
            style={{ background: C.amberBg, color: C.amber, fontWeight: 800, fontSize: '2.2vh', padding: '0.8vh 1.6vh', borderRadius: '1.2vh' }}>انتبه للحصة</motion.div>
        </div>
        <div style={{ color: C.muted, fontSize: '2.2vh', marginBottom: '3vh' }}>الحصة: ١٢٠ جم</div>
        {ROWS.map((r, i) => (
          <div key={r.k} style={{ marginBottom: '2.6vh' }}>
            <div className="flex justify-between" style={{ fontSize: '2.6vh', fontWeight: 700 }}>
              <span>{r.k}</span><span style={{ fontFamily: 'DM Mono, Cairo', color: r.flag ? C.copper : r.w ? C.ink : C.muted }}>{r.v}</span>
            </div>
            <div style={{ height: '1.2vh', background: C.soft, borderRadius: 99, marginTop: '0.8vh', overflow: 'hidden' }}>
              <motion.div style={{ height: '100%', width: '100%', background: r.flag ? C.copper : C.sand, transformOrigin: 'right' }}
                initial={{ scaleX: 0 }} animate={{ scaleX: r.w }} transition={{ delay: 1 + i * 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
            </div>
          </div>
        ))}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6 }}
          style={{ background: C.amberBg, borderRadius: '1.6vh', padding: '1.6vh 2vh', fontSize: '2.4vh', color: C.amber, fontWeight: 600 }}>
          السبب: سكر الملصق أعلى من ١٠ جم في الحصة. القيمة غير المتاحة لا تُحسب صفر.
        </motion.div>
      </motion.div>
      <motion.div className="absolute" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.4 }}
        style={{ right: '6vw', bottom: '9vh', fontSize: '2.8vh', color: C.ink, background: C.soft, padding: '1.4vh 2.4vh', borderRadius: '1.6vh', fontWeight: 700 }}>
        فحص إرشادي من بيانات الملصق — مش تشخيص طبي
      </motion.div>
    </motion.div>
  );
}
