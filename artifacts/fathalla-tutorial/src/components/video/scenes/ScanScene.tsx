import { motion } from 'framer-motion';
import { C, Phone, SceneShell, StepHead } from './kit';

// Barcode bar widths (EAN-like artwork, noninteractive)
const BARS = [2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1, 2, 1, 3, 1, 1, 2, 1, 2, 1];

export function ScanScene() {
  return (
    <SceneShell>
      <StepHead n="١" title="امسح الباركود" sub="وجّه الكاميرا للباركود على بعد ١٥–٢٥ سم، أو اكتب الرقم بإيدك." />
      <Phone>
        <div className="relative overflow-hidden" style={{ background: C.ink, borderRadius: '2vh', height: '36vh' }}>
          <motion.div className="absolute flex items-end gap-[0.3vh] justify-center" style={{ left: '50%', top: '50%', marginLeft: '-14vh', marginTop: '-8vh', width: '28vh', height: '16vh', background: C.paper, borderRadius: '1vh', padding: '1.6vh' }}
            initial={{ scale: 0.7, rotate: 8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 80, damping: 14 }}>
            {BARS.map((w, i) => <div key={i} style={{ width: `${w * 0.28}vh`, height: '100%', background: C.ink }} />)}
          </motion.div>
          {['top-[3vh] left-[3vh] border-t-4 border-l-4', 'top-[3vh] right-[3vh] border-t-4 border-r-4', 'bottom-[3vh] left-[3vh] border-b-4 border-l-4', 'bottom-[3vh] right-[3vh] border-b-4 border-r-4'].map(c => (
            <div key={c} className={`absolute w-[4vh] h-[4vh] ${c}`} style={{ borderColor: C.orange }} />
          ))}
          <motion.div className="absolute" style={{ left: '3vh', right: '3vh', height: '0.5vh', top: '50%', background: C.orange }}
            animate={{ y: ['-10vh', '10vh', '-10vh'] }} transition={{ duration: 1.6, repeat: 2, ease: 'easeInOut' }} />
          <motion.div className="absolute inset-0" style={{ background: C.orange }} initial={{ opacity: 0 }} animate={{ opacity: [0, 0.35, 0] }} transition={{ delay: 2.2, duration: 0.5 }} />
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.4, type: 'spring', stiffness: 110, damping: 15 }}
          style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: '1.8vh', padding: '1.6vh', marginTop: '1.6vh' }}>
          <div className="flex justify-between items-center">
            <div style={{ fontWeight: 800, fontSize: '2.1vh' }}>زبادي بالفراولة</div>
            <div style={{ background: C.amberBg, color: C.amber, fontSize: '1.4vh', fontWeight: 700, padding: '0.4vh 0.8vh', borderRadius: '0.8vh' }}>انتبه للحصة</div>
          </div>
          <div dir="ltr" style={{ fontFamily: 'DM Mono, monospace', fontSize: '1.5vh', color: C.muted, textAlign: 'right', marginTop: '0.4vh' }}>6221000111001</div>
          <div className="grid grid-cols-3 gap-[0.8vh] mt-[1.2vh]">
            {[['سكر', '١٤ جم'], ['كربوهيدرات صافية', '١٩ جم'], ['المؤشر الجلايسيمي', '٣٥']].map(([k, v], i) => (
              <motion.div key={k} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 2.8 + i * 0.12 }}
                style={{ background: C.soft, borderRadius: '1.2vh', padding: '0.8vh' }}>
                <div style={{ fontSize: '1.2vh', color: C.muted }}>{k}</div>
                <div style={{ fontSize: '2vh', fontWeight: 800 }}>{v}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Phone>
    </SceneShell>
  );
}
