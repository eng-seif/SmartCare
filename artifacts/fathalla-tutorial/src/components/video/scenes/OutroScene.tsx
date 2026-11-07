import { motion } from 'framer-motion';
import { BRAND, C, Logo, SceneShell } from './kit';

const STEPS = ['امسح الباركود', 'تصفّح', 'افهم الملصق', 'اسأل', 'اتكلم'];

export function OutroScene() {
  return (
    <SceneShell>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex gap-[1.6vh]">
          {STEPS.map((s, i) => (
            <motion.div key={s} initial={{ y: -80, opacity: 0 }}
              animate={{ y: [-80, 0, 0, 18], opacity: [0, 1, 1, 0], scale: [1, 1, 1, 0.4] }}
              transition={{ delay: i * 0.1, duration: 1.5, times: [0, 0.3, 0.75, 1] }}
              style={{ background: C.ink, color: C.paper, borderRadius: 99, padding: '1.1vh 2.4vh', fontSize: '2.8vh', fontWeight: 800, whiteSpace: 'nowrap' }}>
              <span style={{ color: C.orange }}>{['١', '٢', '٣', '٤', '٥'][i]}</span> {s}
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 1.2, type: 'spring', stiffness: 120, damping: 13 }}
          style={{ marginTop: '-4vh', boxShadow: '0 3vh 6vh #493b2933', borderRadius: '5vh' }}>
          <Logo size="20vh" radius="5vh" />
        </motion.div>
        <motion.div dir="ltr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          style={{ fontSize: '3.4vh', fontWeight: 800, marginTop: '1.6vh', letterSpacing: '0.04em' }}>{BRAND}</motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}
          style={{ fontSize: '8vh', fontWeight: 900, lineHeight: 1.3 }}>سجّل وابدأ</motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }}
          style={{ fontSize: '3vh', color: C.muted }}>تقدر تتخطى الشرح في أي وقت</motion.div>
      </div>
    </SceneShell>
  );
}
