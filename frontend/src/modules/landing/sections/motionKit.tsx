import { ReactNode, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Texte dont chaque lettre monte depuis un masque, l'une après l'autre. Se joue soit quand `play`
// devient vrai (apparition pilotée par le parent, ex. fin de l'ouverture), soit à l'entrée dans
// l'écran (`inView`). Le déclencheur est TOUJOURS le conteneur, jamais une lettre : une lettre
// cachée hors de son masque n'est jamais « visible » pour le navigateur.
export function SplitLetters({
  text,
  className = '',
  stagger = 0.045,
  delay = 0,
  play = true,
  inView = false,
}: {
  text: string;
  className?: string;
  stagger?: number;
  delay?: number;
  play?: boolean;
  inView?: boolean;
}) {
  const trigger = inView
    ? { initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '-10%' } }
    : { initial: 'hidden', animate: play ? 'show' : 'hidden' };

  return (
    <motion.span
      aria-label={text}
      className={`inline-block ${className}`}
      variants={{ show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      {...trigger}
    >
      {Array.from(text).map((char, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden align-bottom pb-[0.14em] -mb-[0.14em]">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: '118%' },
              show: { y: '0%', transition: { duration: 1, ease: EASE_OUT } },
            }}
          >
            {char === ' ' ? ' ' : char}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

// Aimant : l'élément suit légèrement le pointeur quand il s'en approche, puis revient en place
// avec un ressort. Souris uniquement (inutile et gênant au doigt).
export function Magnetic({
  children,
  strength = 0.28,
  className = '',
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 220, damping: 18, mass: 0.4 });
  const y = useSpring(0, { stiffness: 220, damping: 18, mass: 0.4 });

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className={className}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
