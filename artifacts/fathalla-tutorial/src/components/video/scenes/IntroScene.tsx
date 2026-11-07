import { motion } from 'framer-motion';
import { BRAND, C, Logo, SceneShell } from './kit';

const WORDS = ['إزاي', 'تستخدم'];

export function IntroScene() {
  return (
    <SceneShell bg={C.ink}>
      <motion.div className="absolute rounded-full" style={{ width: '140vh', height: '140vh', left: '50%', top: '50%', marginLeft: '-70vh', marginTop: '-70vh', border: `1px solid ${C.sand}33` }}
        initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 3, ease: 'easeOut' }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ boxShadow: `0 0 0 0.4vh ${C.sand}55`, borderRadius: '6vh' }}>
          <Logo size="26vh" radius="6vh" />
        </motion.div>
        <div className="flex gap-[2.4vh] mt-[4vh] items-baseline" style={{ color: C.bg, fontSize: '9vh', fontWeight: 900 }}>
          {WORDS.map((w, i) => (
            <motion.span key={w} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 + i * 0.25, type: 'spring', stiffness: 120, damping: 14 }}>{w}</motion.span>
          ))}
          <motion.span dir="ltr" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.4, type: 'spring', stiffness: 120, damping: 14 }} style={{ color: C.orange }}>{BRAND}?</motion.span>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2, duration: 0.6 }}
          style={{ color: C.sand, fontSize: '3.6vh', marginTop: '1.5vh' }}>٥ خطوات قبل ما تسجّل — وتقدر تتخطاها</motion.div>
      </div>
    </SceneShell>
  );
}
