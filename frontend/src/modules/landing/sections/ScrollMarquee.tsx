import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const PHRASE = 'Guangzhou → Conakry  ·  Fret aérien  ·  ';

// Grand bandeau typographique : deux lignes qui glissent en sens inverse au rythme du défilement
// (l'une en contour, l'autre en aplat très clair). Pur transform, lié au scroll, sans animation
// qui tourne en arrière-plan — il bouge uniquement quand on avance dans la page.
export function ScrollMarquee({ isDark }: { isDark: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const left = useTransform(scrollYProgress, [0, 1], ['4%', '-38%']);
  const right = useTransform(scrollYProgress, [0, 1], ['-38%', '4%']);

  const text = PHRASE.repeat(4);
  const base =
    'whitespace-nowrap font-editorial font-normal leading-[0.95] tracking-tight text-[clamp(4rem,13vw,11rem)] select-none';

  return (
    <div ref={ref} aria-hidden="true" className="relative overflow-hidden py-14 sm:py-20">
      <motion.p
        style={{
          x: left,
          WebkitTextStroke: `1.5px ${isDark ? 'rgba(237,231,219,0.5)' : 'rgba(15,23,42,0.22)'}`,
        }}
        className={`${base} text-transparent`}
      >
        {text}
      </motion.p>
      <motion.p
        style={{ x: right }}
        className={`${base} ${isDark ? 'text-cream/[0.12]' : 'text-slate-900/[0.07]'}`}
      >
        {text}
      </motion.p>
    </div>
  );
}
