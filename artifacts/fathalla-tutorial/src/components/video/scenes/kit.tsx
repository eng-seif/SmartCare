import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export const C = {
  bg: '#f5f0e7', paper: '#fffdf8', soft: '#eee4d4', soft2: '#e0d2bd', ink: '#252525',
  muted: '#6d6255', line: '#ddd4c6', sand: '#d9c6a5', copper: '#8f552f', orange: '#f39a2b',
  amberBg: '#f6eddc', amber: '#80531f', redBg: '#f8e7e3', red: '#8b3430',
};
export const BRAND = 'Smart Care';

/** Original Smart Care mark: heart-leaf with a check, on charcoal tile. */
export function Logo({ size, radius }: { size: string; radius?: string }) {
  return (
    <svg viewBox="0 0 120 120" style={{ width: size, height: size, borderRadius: radius, display: 'block' }}>
      <rect width="120" height="120" rx="30" fill="#252525" />
      <path d="M60 92C36 78 26 62 26 47c0-11 8-19 18-19 7 0 12 3 16 9 4-6 9-9 16-9 10 0 18 8 18 19 0 15-10 31-34 45z" fill="#f39a2b" />
      <path d="M44 58l11 11 22-24" fill="none" stroke="#fffdf8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="88" cy="30" r="6" fill="#d9c6a5" />
    </svg>
  );
}

export function SceneShell({ children, bg = C.bg }: { children: ReactNode; bg?: string }) {
  return (
    <motion.div
      dir="rtl"
      className="absolute inset-0 overflow-hidden"
      style={{ background: bg, fontFamily: 'Cairo, sans-serif', color: C.ink }}
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Big outlined step numeral + title on the right side (RTL start). */
export function StepHead({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <div className="absolute" style={{ right: '6vw', top: '14vh', width: '40vw' }}>
      <motion.div
        initial={{ x: 120, opacity: 0, scale: 1.6 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 90, damping: 16 }}
        style={{ fontSize: '30vh', lineHeight: 0.9, fontWeight: 900, color: 'transparent', WebkitTextStroke: `0.35vh ${C.copper}` }}
      >{n}</motion.div>
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ fontSize: '7.4vh', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.2, marginTop: '2vh' }}
      >{title}</motion.div>
      <motion.div
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        style={{ fontSize: '3.4vh', color: C.muted, marginTop: '1.4vh', lineHeight: 1.6 }}
      >{sub}</motion.div>
    </div>
  );
}

/** Noninteractive phone artwork on the left. */
export function Phone({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="absolute"
      style={{ left: '9vw', top: '7vh', width: '46vh', height: '86vh', borderRadius: '5.5vh', background: C.ink, padding: '1.4vh', boxShadow: '0 4vh 9vh #493b2933' }}
      initial={{ y: '30vh', rotate: -6, opacity: 0 }}
      animate={{ y: 0, rotate: -2, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 70, damping: 15, delay: 0.15 }}
    >
      <div className="w-full h-full overflow-hidden relative" style={{ borderRadius: '4.4vh', background: C.bg, padding: '2.6vh 2.2vh' }}>
        <div className="flex items-center gap-[1.2vh] mb-[2vh]">
          <Logo size="4.6vh" radius="1.3vh" />
          <div dir="ltr" style={{ fontWeight: 800, fontSize: '2.4vh' }}>{BRAND}</div>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

export function TapRing({ delay, x, y }: { delay: number; x: string; y: string }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: y, width: '7vh', height: '7vh', marginLeft: '-3.5vh', marginTop: '-3.5vh', borderRadius: '50%', border: `0.5vh solid ${C.copper}` }}
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: [0.3, 1, 1.6], opacity: [0, 1, 0] }}
      transition={{ delay, duration: 0.9, times: [0, 0.35, 1] }}
    />
  );
}
