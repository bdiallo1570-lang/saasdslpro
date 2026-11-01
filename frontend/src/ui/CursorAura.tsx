import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';

// Éléments qui font réagir le curseur : onglets, boutons, liens, interrupteurs…
// `data-cursor` permet d'en ajouter un à la main.
const INTERACTIVE =
  'a[href], button:not(:disabled), [role="tab"], [role="switch"], [role="button"], [role="menuitem"], [role="option"], select, summary, label[for], [data-cursor]';
// Champs de saisie : le curseur texte natif suffit, l'anneau se fait tout petit
const TEXT_FIELD =
  'input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]';
// Zones où le curseur devient une pastille avec un mot (« Défiler », « Glisser »…)
const LABELLED = '[data-cursor-label]';

// Au-delà de cette taille (grandes cartes cliquables), on n'entoure pas l'élément : l'anneau grossit
const MAX_WRAP_W = 560;
const MAX_WRAP_H = 220;
const PAD = 6;
const SIZE = { idle: 28, grow: 56, text: 6 } as const;

type Mode = 'idle' | 'wrap' | 'grow' | 'text' | 'label';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

// Curseur magnétique, monté une seule fois pour toute l'application. Le curseur natif reste
// affiché : l'anneau l'accompagne avec un léger retard et, au survol d'un onglet ou d'un bouton,
// vient épouser sa forme (rayon compris). Sur les zones marquées `data-cursor-label`, il devient
// une pastille dorée portant le mot indiqué. Chaque clic lâche une onde. Désactivé au tactile et
// si l'utilisateur préfère réduire les animations.
export function CursorAura() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return enabled ? <Aura /> : null;
}

function Aura() {
  const [mode, setMode] = useState<Mode>('idle');
  const [label, setLabel] = useState('');
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const w = useMotionValue<number>(SIZE.idle);
  const h = useMotionValue<number>(SIZE.idle);
  const r = useMotionValue(SIZE.idle / 2);
  const px = useMotionValue(-100);
  const py = useMotionValue(-100);
  const opacity = useMotionValue(0);
  const scale = useMotionValue(1);

  const follow = { stiffness: 520, damping: 42, mass: 0.6 };
  const sx = useSpring(x, follow);
  const sy = useSpring(y, follow);
  const sw = useSpring(w, follow);
  const sh = useSpring(h, follow);
  const sr = useSpring(r, follow);
  // La pastille traîne un peu plus que l'anneau : elle « flotte » derrière le pointeur
  const lx = useSpring(px, { stiffness: 260, damping: 26, mass: 0.6 });
  const ly = useSpring(py, { stiffness: 260, damping: 26, mass: 0.6 });
  const sOpacity = useSpring(opacity, { stiffness: 300, damping: 30 });
  const sScale = useSpring(scale, { stiffness: 600, damping: 28 });

  useEffect(() => {
    let target: HTMLElement | null = null;
    let radius = 0;
    let current: Mode = 'idle';
    let pointerX = -100;
    let pointerY = -100;
    let rippleId = 0;
    let raf = 0;

    function setCurrent(next: Mode) {
      if (next !== current) {
        current = next;
        setMode(next);
      }
    }

    function place() {
      // L'élément survolé a pu disparaître (navigation, fermeture d'une fenêtre)
      if (target && !target.isConnected) {
        target = null;
        setCurrent('idle');
      }
      if (target) {
        const rect = target.getBoundingClientRect();
        // Effet magnétique : l'anneau penche légèrement vers le pointeur
        const dx = (pointerX - (rect.left + rect.width / 2)) * 0.08;
        const dy = (pointerY - (rect.top + rect.height / 2)) * 0.08;
        const height = rect.height + PAD * 2;
        x.set(rect.left - PAD + dx);
        y.set(rect.top - PAD + dy);
        w.set(rect.width + PAD * 2);
        h.set(height);
        r.set(Math.min(radius + PAD, height / 2));
      } else {
        const size =
          current === 'grow' ? SIZE.grow : current === 'text' ? SIZE.text : current === 'label' ? 0 : SIZE.idle;
        x.set(pointerX - size / 2);
        y.set(pointerY - size / 2);
        w.set(size);
        h.set(size);
        r.set(size / 2);
      }
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return;
      pointerX = e.clientX;
      pointerY = e.clientY;
      px.set(pointerX);
      py.set(pointerY);
      opacity.set(1);

      const el = e.target instanceof Element ? e.target : null;
      const hit = el?.closest<HTMLElement>(INTERACTIVE) ?? null;
      const isText = !!el?.closest(TEXT_FIELD);
      const labelled = el?.closest<HTMLElement>(LABELLED) ?? null;

      let next: HTMLElement | null = null;
      let nextMode: Mode = isText ? 'text' : 'idle';
      if (hit && !isText) {
        const rect = hit.getBoundingClientRect();
        if (rect.width <= MAX_WRAP_W && rect.height <= MAX_WRAP_H) {
          next = hit;
          nextMode = 'wrap';
        } else {
          nextMode = 'grow';
        }
      }
      // Une zone étiquetée l'emporte sur l'état « grossi », jamais sur un bouton entouré
      if (labelled && nextMode !== 'wrap' && nextMode !== 'text') {
        nextMode = 'label';
        setLabel(labelled.dataset.cursorLabel ?? '');
      }
      if (next !== target) {
        target = next;
        radius = target ? parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0 : 0;
        if (target && !raf) raf = requestAnimationFrame(track);
      }
      setCurrent(nextMode);
      place();
    }

    // Tant qu'un élément est entouré, l'anneau le suit à chaque image : l'élément peut bouger sans
    // que la souris bouge (bouton aimanté, carte inclinée) ou disparaître (clic qui change de page).
    // Sans ce suivi, l'anneau restait figé là où était le bouton jusqu'au prochain mouvement.
    function track() {
      place();
      raf = target ? requestAnimationFrame(track) : 0;
    }

    function onDown(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return;
      scale.set(0.9);
      const id = ++rippleId;
      setRipples((list) => [...list.slice(-4), { id, x: e.clientX, y: e.clientY }]);
    }
    const onUp = () => scale.set(1);
    const onLeave = (e: PointerEvent) => {
      if (!e.relatedTarget) opacity.set(0);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('pointerout', onLeave);
    // Au défilement, l'élément survolé bouge sous le pointeur : on recolle l'anneau dessus
    window.addEventListener('scroll', place, { passive: true, capture: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerout', onLeave);
      window.removeEventListener('scroll', place, { capture: true });
    };
  }, [x, y, w, h, r, px, py, opacity, scale]);

  return (
    <>
      <motion.div
        aria-hidden="true"
        style={{ x: sx, y: sy, width: sw, height: sh, borderRadius: sr, opacity: sOpacity, scale: sScale }}
        // `difference` : l'anneau blanc s'inverse sur fond clair, il reste visible dans les deux thèmes
        className="pointer-events-none fixed left-0 top-0 z-[9999] mix-blend-difference"
      >
        <div
          className={`h-full w-full rounded-[inherit] border transition-[background-color,border-color] duration-300 ${
            mode === 'wrap'
              ? 'border-white/60 bg-white/[0.07]'
              : mode === 'grow'
                ? 'border-white/40 bg-white/[0.07]'
                : mode === 'text'
                  ? 'border-transparent bg-white/80'
                  : mode === 'label'
                    ? 'border-transparent'
                    : 'border-white/70'
          }`}
        />
      </motion.div>

      {/* Pastille étiquetée */}
      <motion.div
        aria-hidden="true"
        style={{ x: lx, y: ly, opacity: sOpacity }}
        className="pointer-events-none fixed left-0 top-0 z-[9999]"
      >
        <motion.div
          initial={false}
          animate={mode === 'label' ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          className="-ml-11 -mt-11 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gradient-to-br from-ember-300 to-ember-500 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-950 shadow-[0_10px_40px_-8px_rgba(245,158,11,0.7)]"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={label}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Ondes de clic */}
      {ripples.map((rp) => (
        <motion.span
          key={rp.id}
          aria-hidden="true"
          initial={{ scale: 0, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          onAnimationComplete={() => setRipples((list) => list.filter((it) => it.id !== rp.id))}
          style={{ left: rp.x - 45, top: rp.y - 45 }}
          className="pointer-events-none fixed z-[9999] h-[90px] w-[90px] rounded-full border-2 border-white mix-blend-difference"
        />
      ))}
    </>
  );
}
