import { motion } from 'framer-motion';
import { C, Phone, SceneShell, StepHead } from './kit';

export function ChatScene() {
  return (
    <SceneShell>
      <StepHead n="٤" title="اسأل عن التغذية" sub="المساعد بيشرح الملصقات والمؤشر الجلايسيمي والحصص — من غير تشخيص." />
      <Phone>
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: '2vh', padding: '1.8vh', height: '68vh' }} className="flex flex-col gap-[1.4vh]">
          <div className="flex items-center gap-[1vh]">
            <div style={{ width: '4.6vh', height: '4.6vh', borderRadius: '1.4vh', background: C.ink, color: C.paper, fontWeight: 900, fontSize: '2.2vh' }} className="grid place-items-center">م</div>
            <div><div style={{ fontWeight: 800, fontSize: '2vh' }}>مساعد التغذية</div><div style={{ fontSize: '1.4vh', color: C.muted }}>إرشادي، مش بديل للطبيب</div></div>
          </div>
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
            style={{ alignSelf: 'flex-start', background: C.ink, color: C.paper, borderRadius: '1.8vh', padding: '1.2vh 1.6vh', fontSize: '1.9vh', maxWidth: '85%', lineHeight: 1.6 }}>
            إيه الفرق بين المؤشر الجلايسيمي والحمل الجلايسيمي؟
          </motion.div>
          <motion.div className="flex gap-[0.6vh]" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 2.4 }}
            style={{ alignSelf: 'flex-end', background: C.soft, borderRadius: '1.8vh', padding: '1.4vh' }}>
            {[0, 1, 2].map(i => <motion.span key={i} animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.12 }} style={{ width: '1vh', height: '1vh', borderRadius: 9, background: C.muted }} />)}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.5 }}
            style={{ alignSelf: 'flex-end', background: C.soft, borderRadius: '1.8vh', padding: '1.4vh 1.6vh', fontSize: '1.85vh', lineHeight: 1.7, marginTop: '-6vh' }}>
            المؤشر بيقيس سرعة رفع الأكل للسكر، والحمل بيضرب ده في كمية الكربوهيدرات في الحصة.
            <div className="flex gap-[0.8vh] mt-[1vh] flex-wrap">
              {['منخفض GI ≤ ٥٥', 'منخفض GL ≤ ١٠'].map((t, i) => (
                <motion.span key={t} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 3.3 + i * 0.2, type: 'spring' }}
                  style={{ background: C.paper, border: `1px solid ${C.copper}`, color: C.copper, borderRadius: 99, padding: '0.3vh 1.2vh', fontWeight: 700, fontSize: '1.6vh' }}>{t}</motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </Phone>
    </SceneShell>
  );
}
