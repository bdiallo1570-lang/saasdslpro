import { ReactNode, useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

interface TiltProps {
  children: ReactNode;
  // Inclinaison maximale en degrés, atteinte au bord de l'élément
  max?: number;
  glare?: boolean;
  className?: string;
}

// Carte qui s'incline vers le pointeur, avec un reflet de lumière qui suit la souris. Expose aussi
// `--tilt-x` / `--tilt-y` (de -1 à 1) aux enfants, pour des effets de profondeur en CSS, ex. une
// photo qui glisse en sens inverse : `[translate:calc(var(--tilt-x)*-12px)_calc(var(--tilt-y)*-12px)]`.
// Souris uniquement ; immobile si l'utilisateur préfère réduire les animations.
export function Tilt({ children, max = 7, glare = true, className = '' }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const spring = { stiffness: 220, damping: 20, mass: 0.5 };
  const tx = useSpring(0, spring);
  const ty = useSpring(0, spring);
  const rotateY = useSpring(0, spring);
  const rotateX = useSpring(0, spring);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 30 });
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.2), transparent 55%)`;

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformPerspective: 1100, '--tilt-x': tx, '--tilt-y': ty } as never}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== 'mouse' || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        tx.set(px * 2 - 1);
        ty.set(py * 2 - 1);
        rotateY.set((px * 2 - 1) * max);
        rotateX.set(-(py * 2 - 1) * max);
        gx.set(px * 100);
        gy.set(py * 100);
        glareOpacity.set(1);
      }}
      onPointerLeave={() => {
        tx.set(0);
        ty.set(0);
        rotateX.set(0);
        rotateY.set(0);
        glareOpacity.set(0);
      }}
      className={`relative ${className}`}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden="true"
          style={{ background: glareBg, opacity: glareOpacity }}
          className="pointer-events-none absolute inset-0 z-30 rounded-[inherit]"
        />
      )}
    </motion.div>
  );
}
