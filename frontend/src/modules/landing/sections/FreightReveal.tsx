import { useEffect, useRef, useState } from 'react';
import { motion, useMotionTemplate, useScroll, useSpring, useTransform, MotionValue } from 'framer-motion';
import { Plane, Ship } from 'lucide-react';
import { MARITIME } from '../maritime/maritimeConfig';

// Visuels générés pour DSL (Higgsfield) : boucles vidéo sans son + image d'attente identique à
// la première image de la vidéo, pour qu'il n'y ait aucun saut au démarrage.
const AIR = { video: '/video/freight-air.mp4', poster: '/images/freight/air.jpg' };
const SEA = { video: '/video/freight-sea.mp4', poster: '/images/freight/sea.jpg' };

// Transition épinglée entre l'aérien et le maritime, pilotée au défilement :
//  1. la fenêtre « avion » s'ouvre d'une carte arrondie jusqu'au plein écran (zoom avant),
//  2. le bateau apparaît dans un cercle qui s'élargit depuis le centre, pendant que l'avion
//     continue de zoomer et s'assombrit — on « traverse » une image pour entrer dans l'autre,
//  3. on termine sur l'océan, qui enchaîne avec la traversée maritime juste en dessous.
export function FreightReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.35 });

  // 1. Fenêtre avion : clip-path inset qui s'ouvre, image qui dézoome en sens inverse
  const insetY = useTransform(p, [0, 0.38], [22, 0]);
  const insetX = useTransform(p, [0, 0.38], [28, 0]);
  const radius = useTransform(p, [0, 0.38], [40, 0]);
  const airClip = useMotionTemplate`inset(${insetY}% ${insetX}% round ${radius}px)`;
  const airScale = useTransform(p, [0, 0.38, 0.85], [1.35, 1, 1.18]);
  const airDim = useTransform(p, [0.5, 0.78], [0, 0.6]);

  // 2. Bateau : iris circulaire qui s'ouvre, image qui dézoome
  const seaRadius = useTransform(p, [0.5, 0.82], [0, 80]);
  const seaClip = useMotionTemplate`circle(${seaRadius}% at 50% 50%)`;
  const seaScale = useTransform(p, [0.5, 1], [1.45, 1]);

  // Intro au-dessus de la carte, qui s'efface quand la fenêtre s'ouvre
  const introOpacity = useTransform(p, [0, 0.18], [1, 0]);
  const introY = useTransform(p, [0, 0.18], [0, -40]);

  return (
    <section ref={ref} id="voies" aria-label="Deux voies : l'avion et le bateau" className="relative h-[340vh] bg-ink-950">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div
          style={{ opacity: introOpacity, y: introY }}
          className="absolute inset-x-0 top-[8%] z-20 px-4 text-center"
        >
          <p className="font-label text-[11px] uppercase tracking-[0.3em] text-ember-400">Deux voies, une seule équipe</p>
          <p className="mx-auto mt-3 max-w-2xl font-editorial text-4xl text-cream sm:text-5xl">
            Choisissez la vitesse, ou le volume.
          </p>
        </motion.div>

        {/* Avion */}
        <motion.div style={{ clipPath: airClip }} className="absolute inset-0 will-change-[clip-path]">
          <motion.div style={{ scale: airScale }} className="absolute inset-0">
            <LoopVideo {...AIR} />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-ink-950/40" />
          <motion.div style={{ opacity: airDim }} className="absolute inset-0 bg-ink-950" />
        </motion.div>

        {/* Bateau */}
        <motion.div style={{ clipPath: seaClip }} className="absolute inset-0 will-change-[clip-path]">
          <motion.div style={{ scale: seaScale }} className="absolute inset-0">
            <LoopVideo {...SEA} />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-ink-950/50" />
        </motion.div>

        <Caption
          p={p}
          range={[0.2, 0.32, 0.48, 0.56]}
          from={-80}
          icon={<Plane size={18} />}
          eyebrow="Fret aérien"
          title="Par les airs"
          text="Pour ce qui ne peut pas attendre : vos colis sont pesés à Guangzhou, groupés et envolés vers Conakry."
          align="left"
        />
        <Caption
          p={p}
          range={[0.68, 0.8, 1.1, 1.2]}
          from={80}
          icon={<Ship size={18} />}
          eyebrow="Fret maritime"
          title="Ou par la mer"
          text={`Pour les gros volumes : facturé au mètre cube, livré en ≈\u00A0${MARITIME.transitLabel}.`}
          align="right"
        />
      </div>
    </section>
  );
}

// Légende qui glisse depuis le côté, reste lisible le temps de sa phase, puis repart
function Caption({
  p,
  range,
  from,
  icon,
  eyebrow,
  title,
  text,
  align,
}: {
  p: MotionValue<number>;
  range: [number, number, number, number];
  from: number;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  text: string;
  align: 'left' | 'right';
}) {
  const opacity = useTransform(p, range, [0, 1, 1, 0]);
  const x = useTransform(p, range, [from, 0, 0, -from]);
  const blur = useTransform(p, range, [10, 0, 0, 10]);
  const filter = useMotionTemplate`blur(${blur}px)`;

  return (
    <motion.div
      style={{ opacity, x, filter }}
      className={`absolute bottom-[15%] sm:bottom-[10%] z-20 max-w-xl px-6 sm:px-12 ${align === 'left' ? 'left-0' : 'right-0 text-right sm:pr-24'}`}
    >
      <p
        className={`flex items-center gap-2 font-label text-[11px] uppercase tracking-[0.3em] text-ember-400 ${
          align === 'right' ? 'justify-end' : ''
        }`}
      >
        {icon}
        {eyebrow}
      </p>
      <p className="mt-3 font-editorial text-6xl leading-none text-cream sm:text-8xl">{title}</p>
      <p className="mt-4 text-base text-slate-300 [text-wrap:balance] sm:text-lg">{text}</p>
    </motion.div>
  );
}

// Vidéo d'ambiance : muette, en boucle, mise en pause hors écran pour ne pas consommer de
// batterie, et remplacée par son image fixe si l'utilisateur préfère réduire les animations.
// Rien n'est téléchargé (ni image, ni vidéo) avant que la section approche de l'écran : sur une
// connexion mobile lente, la bande passante va d'abord au haut de page.
function LoopVideo({ video, poster }: { video: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: '150% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !near) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => {});
      else el.pause();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  return (
    <video
      ref={ref}
      src={near ? video : undefined}
      poster={near ? poster : undefined}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      className="h-full w-full object-cover"
    />
  );
}
