import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SplitLetters } from './motionKit';

const STORAGE_KEY = 'dsl_intro_seen';

// Ouverture de la page, une seule fois par session : écran noir, le nom de la marque se lève
// lettre par lettre, une route aérienne se trace de Guangzhou à Conakry avec une pointe lumineuse
// qui la parcourt, puis l'écran s'ouvre en deux comme un rideau et révèle la vidéo. Ignorée pour
// les visiteurs qui demandent moins d'animations. Un clic n'importe où la passe.
export function shouldPlayIntro(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return !sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

const OPEN_AT_MS = 2000;
const DONE_AT_MS = 3000;
// Courbe de la route (viewBox 0 0 520 120) : un arc de Guangzhou (gauche) à Conakry (droite)
const ROUTE = 'M 8 104 C 150 -14, 370 -14, 512 104';

export function CinematicIntro({ onDone, onOpen }: { onDone: () => void; onOpen: () => void }) {
  const [phase, setPhase] = useState<'title' | 'open'>('title');

  useEffect(() => {
    const open = setTimeout(() => {
      setPhase('open');
      onOpen();
    }, OPEN_AT_MS);
    const done = setTimeout(finish, DONE_AT_MS);
    return () => {
      clearTimeout(open);
      clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* stockage indisponible : l'ouverture se rejouera, sans conséquence */
    }
    onOpen();
    onDone();
  }

  const opening = phase === 'open';
  const panel = 'absolute inset-x-0 h-1/2 bg-ink-950';
  const EASE = [0.76, 0, 0.24, 1] as const;

  return (
    <div className="fixed inset-0 z-[70]" onClick={finish} role="presentation" aria-hidden="true">
      <motion.div
        className={`${panel} top-0`}
        animate={{ y: opening ? '-100%' : '0%' }}
        transition={{ duration: 1, ease: EASE }}
      />
      <motion.div
        className={`${panel} bottom-0`}
        animate={{ y: opening ? '100%' : '0%' }}
        transition={{ duration: 1, ease: EASE }}
      />

      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        animate={{ opacity: opening ? 0 : 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Lueur ambre derrière le titre */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[min(60rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-400/[0.07] blur-3xl" />

        <h1 className="relative font-editorial text-6xl font-normal tracking-tight text-cream sm:text-9xl">
          <SplitLetters text="DSL Air Cargo" stagger={0.05} delay={0.15} />
        </h1>

        {/* Route aérienne : le trait se trace, la pointe l'accompagne */}
        <div className="relative mt-8 h-[120px] w-[min(520px,86vw)]">
          <svg viewBox="0 0 520 120" className="absolute inset-0 h-full w-full overflow-visible" fill="none">
            <path d={ROUTE} stroke="rgba(237,231,219,0.14)" strokeWidth="1" />
            <motion.path
              d={ROUTE}
              stroke="#EDE7DB"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.5, ease: EASE }}
            />
          </svg>
          <motion.span
            className="absolute left-0 top-0 block h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-300 shadow-[0_0_16px_6px_rgba(255,179,92,0.6)]"
            style={{ offsetPath: `path("${ROUTE}")`, offsetRotate: '0deg' }}
            initial={{ offsetDistance: '0%', opacity: 0 }}
            animate={{ offsetDistance: '100%', opacity: 1 }}
            transition={{
              offsetDistance: { duration: 1.5, delay: 0.5, ease: EASE },
              opacity: { duration: 0.2, delay: 0.5 },
            }}
          />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="absolute -bottom-7 left-0 font-label text-[10px] uppercase tracking-[0.3em] text-cream/55"
          >
            Guangzhou
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.7 }}
            className="absolute -bottom-7 right-0 font-label text-[10px] uppercase tracking-[0.3em] text-cream/55"
          >
            Conakry
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
}
