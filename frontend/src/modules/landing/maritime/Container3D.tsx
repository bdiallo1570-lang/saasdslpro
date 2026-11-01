import { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';

// Dimensions du conteneur à l'écran (px) — longueur, hauteur, profondeur
const L = 300;
const H = 118;
const D = 112;

interface Container3DProps {
  // Taux de remplissage, de 0 à 1
  fill: number;
  isDark: boolean;
}

// Conteneur maritime en vraie 3D CSS (six faces, preserve-3d) qui tangue doucement sur l'eau.
// Le chargement à l'intérieur est un second bloc 3D, étiré en longueur selon le volume saisi :
// on le voit à travers la paroi avant et le toit vitrés.
export function Container3D({ fill, isDark }: Container3DProps) {
  const ratio = Math.max(0, Math.min(1, fill));

  return (
    <div className="relative mx-auto flex h-[230px] w-full max-w-[420px] items-center justify-center [perspective:1100px]">
      {/* Reflet / ombre au sol */}
      <motion.div
        aria-hidden="true"
        animate={{ scaleX: [1, 0.94, 1], opacity: [0.55, 0.4, 0.55] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute bottom-3 h-6 w-[78%] rounded-[50%] blur-xl ${isDark ? 'bg-cyan-400/25' : 'bg-slate-900/20'}`}
      />

      <motion.div
        animate={{ y: [0, -7, 0], rotateZ: [0, 0.8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="[transform-style:preserve-3d]"
      >
        <div
          className="relative [transform-style:preserve-3d]"
          style={{ width: L, height: H, transform: 'rotateX(-22deg) rotateY(-34deg) scale(0.92)' }}
        >
          {/* Coque : fond, sol, extrémité gauche et portes à droite pleines ; avant et toit vitrés */}
          <Face w={L} h={H} t={`rotateY(180deg) translateZ(${D / 2}px)`} className="container-steel" />
          <Face w={L} h={D} t={`rotateX(-90deg) translateZ(${H / 2}px)`} style={{ top: (H - D) / 2 }} className="bg-[#7c3a0a]" />
          <Face w={D} h={H} t={`rotateY(-90deg) translateZ(${L / 2}px)`} style={{ left: (L - D) / 2 }} className="container-steel" />

          {/* Chargement : bloc de cartons étiré depuis le fond du conteneur */}
          <motion.div
            className="absolute left-0 top-0 [transform-style:preserve-3d]"
            style={{ width: L, height: H, transformOrigin: '0% 50%' }}
            initial={false}
            animate={{ scaleX: ratio === 0 ? 0.0001 : ratio }}
            transition={{ type: 'spring', stiffness: 70, damping: 16 }}
          >
            <Cargo />
          </motion.div>

          <Face
            w={D}
            h={H}
            t={`rotateY(90deg) translateZ(${L / 2}px)`}
            style={{ left: (L - D) / 2 }}
            className="container-doors"
          />
          <Face
            w={L}
            h={D}
            t={`rotateX(90deg) translateZ(${H / 2}px)`}
            style={{ top: (H - D) / 2 }}
            className="border-2 border-ember-400/90 bg-cyan-100/[0.05]"
          />
          <Face
            w={L}
            h={H}
            t={`translateZ(${D / 2}px)`}
            className="container-glass border-2 border-ember-400"
          >
            <span className="absolute left-3 top-2 font-label text-[9px] tracking-[0.3em] text-ember-300/90">DSL · CARGO</span>
          </Face>
        </div>
      </motion.div>
    </div>
  );
}

// Les cartons : faces visibles (avant, dessus, extrémité) avec texture kraft + scotch
function Cargo() {
  const inset = 6;
  const h = H - inset * 2;
  const d = D - inset * 2;
  return (
    <>
      <Face w={L} h={h} t={`translateZ(${d / 2}px)`} style={{ top: inset }} className="cargo-kraft" />
      <Face w={L} h={d} t={`rotateX(90deg) translateZ(${h / 2}px)`} style={{ top: inset + (h - d) / 2 }} className="cargo-kraft-top" />
      <Face w={d} h={h} t={`rotateY(90deg) translateZ(${L / 2}px)`} style={{ top: inset, left: (L - d) / 2 }} className="cargo-kraft brightness-90" />
    </>
  );
}

function Face({
  w,
  h,
  t,
  className = '',
  style,
  children,
}: {
  w: number;
  h: number;
  t: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div
      className={`absolute left-0 top-0 [backface-visibility:visible] ${className}`}
      style={{ width: w, height: h, transform: t, ...style }}
    >
      {children}
    </div>
  );
}
