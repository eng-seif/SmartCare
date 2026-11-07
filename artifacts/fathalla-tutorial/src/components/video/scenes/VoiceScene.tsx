import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { C, SceneShell, StepHead } from './kit';

const TEXT = 'هل الشوفان مناسب لو عندي سكر؟';
const BARS = [0.4, 0.7, 1, 0.55, 0.85, 0.35, 0.95, 0.6, 0.8, 0.45, 0.9, 0.5, 0.75, 0.4, 0.65];

export function VoiceScene() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const words = TEXT.split(' ');
    const ids = words.map((_, i) => window.setTimeout(() => setN(i + 1), 2600 + i * 230));
    return () => ids.forEach(clearTimeout);
  }, []);
  const shown = TEXT.split(' ').slice(0, n).join(' ');
  return (
    <SceneShell bg={C.ink}>
      <div style={{ color: C.bg }}>
        <StepHead n="٥" title="اتكلم بدل ما تكتب" sub="دوس على الميكروفون، اتكلم، والكلام يتحول لنص تراجعه وتعدّله قبل الإرسال." />
      </div>
      <div className="absolute flex flex-col items-center" style={{ left: '8vw', top: '14vh', width: '44vw' }}>
        <div className="relative grid place-items-center" style={{ width: '24vh', height: '24vh' }}>
          {[0, 1].map(i => (
            <motion.div key={i} className="absolute rounded-full" style={{ inset: 0, border: `0.4vh solid ${C.orange}` }}
              initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: [0.6, 1.5], opacity: [0.8, 0] }}
              transition={{ delay: 0.6 + i * 0.6, duration: 1.2, repeat: 1, repeatDelay: 0 }} />
          ))}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 0.3 }}
            className="grid place-items-center rounded-full" style={{ width: '16vh', height: '16vh', background: C.orange }}>
            <svg width="7vh" height="7vh" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2.2" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
          </motion.div>
        </div>
        <div className="flex items-center gap-[0.8vh] mt-[3vh]" style={{ height: '10vh' }}>
          {BARS.map((h, i) => (
            <motion.div key={i} style={{ width: '1.2vh', height: '10vh', borderRadius: 9, background: C.sand }}
              initial={{ scaleY: 0.1 }} animate={{ scaleY: [0.1, h, h * 0.4, h, 0.1] }}
              transition={{ delay: 0.8, duration: 2.2, ease: 'easeInOut', times: [0, 0.25, 0.5, 0.75, 1] }} />
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.4 }}
          className="flex items-center gap-[1.4vh] mt-[3vh]" style={{ width: '100%', background: C.paper, borderRadius: '2vh', padding: '1.8vh 2.2vh', color: C.ink }}>
          <div className="flex-1" style={{ fontSize: '3vh', fontWeight: 700, minHeight: '4.4vh' }}>
            {shown}<motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} style={{ color: C.copper }}>|</motion.span>
          </div>
          <motion.div animate={{ background: n >= 6 ? C.ink : C.soft2 }} transition={{ delay: 1.2 }} className="grid place-items-center"
            style={{ width: '6vh', height: '6vh', borderRadius: '1.4vh' }}>
            <svg width="3vh" height="3vh" viewBox="0 0 24 24" fill="none" stroke={C.paper} strokeWidth="2.4"><path d="M20 12H4M10 6l-6 6 6 6" /></svg>
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.2 }}
          style={{ color: C.sand, fontSize: '2.6vh', marginTop: '1.6vh', fontWeight: 600 }}>راجع النص وعدّله، وبعدين ابعته</motion.div>
      </div>
    </SceneShell>
  );
}
