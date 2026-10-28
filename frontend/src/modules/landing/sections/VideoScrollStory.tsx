import { ReactNode, useEffect, useRef } from 'react';
import { motion, MotionValue, useMotionValue, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { TrackingPanel } from './TrackingPanel';
import { Magnetic, SplitLetters } from './motionKit';

interface VideoScrollStoryProps {
  onSimulateClick: () => void;
  // Vrai quand l'ouverture animée s'ouvre : l'écran d'accueil se compose alors, lettre après lettre.
  ready: boolean;
}

// Le voyage d'un colis en vidéo, jouée par le scroll : la vidéo n'est jamais lue, seulement
// « scrubbée » (video.currentTime suit la progression du défilement), comme une timeline.
// La scène reste collée à l'écran (sticky) pendant ~7 écrans de défilement.
//
// La vidéo est horizontale (16:9, 854×480) et remplit tout l'écran en « cover » : sur ordinateur
// elle s'affiche presque en entier, sur téléphone (portrait) seule une bande est visible, donc
// le cadrage horizontal suit le colis.
//
// Encodée sans son, avec une image clé toutes les 3 images et SANS images B (voir public/video,
// ffmpeg -g 3 -bf 0 -crf 27) : reculer ne fait décoder au navigateur que 2 images au maximum, et
// le fichier reste léger (2,5 Mo). Avec des images B ou des images clés espacées, chaque saut en
// arrière redécode plusieurs images — d'où la saccade. Ne pas la remplacer par une vidéo
// « normale » : le scrub deviendrait saccadé, surtout en marche arrière.

const VIDEO_SRC = '/video/scroll-story.mp4';
const POSTER = '/video/scroll-story-poster.jpg';
const FPS = 24;
const VIDEO_W = 854;
const VIDEO_H = 480;

// Fraction de l'écoulement de la vidéo (0 → 1) pour chaque chapitre (la vidéo dure 15 s) :
// marché 0–3 s · pesée et étiquette DSL 3–6 s · chargement, décollage et vol 6–11 s ·
// remise du colis 11–13 s · gros plan sur le colis 13–15 s.
const CHAPTERS = [
  { range: [0, 0.11], label: 'Guangzhou' },
  { range: [0.11, 0.21], label: 'Achat' },
  { range: [0.21, 0.4], label: 'Pesée' },
  { range: [0.4, 0.72], label: 'Vol' },
  { range: [0.72, 0.87], label: 'Madina' },
  { range: [0.87, 1], label: 'Livraison' },
] as const;

// Cadrage (object-position, en %) quand le colis n'est pas à l'image : le marché, avec le
// client à gauche du centre. Dès que le colis apparaît, le cadrage se centre sur lui.
const MANUAL_FRAMING = { x: 42, y: 50 };

// Position du sujet (le colis, puis l'avion pendant le vol), relevée à la main sur les images :
// [temps (s), x, y, visible] avec x et y en fraction de la largeur / hauteur de la vidéo (0–1).
// Entre deux relevés la position est interpolée ; deux relevés très proches marquent une coupe
// de montage. Sert uniquement à cadrer la vidéo sur le sujet quand l'écran la coupe (téléphone).
const PARCEL_KEYS: readonly (readonly [number, number, number, number])[] = [
  [2.9, 0.47, 0.32, 0], // balance : le colis apparaît
  [3.2, 0.47, 0.32, 1],
  [3.8, 0.48, 0.47, 1],
  [5.0, 0.48, 0.47, 1],
  [5.3, 0.5, 0.5, 0], // gros plan sur l'étiquette DSL : pas de cadrage particulier
  [5.9, 0.5, 0.5, 0],
  [6.0, 0.42, 0.55, 1], // chargement sur la palette
  [6.5, 0.42, 0.55, 1],
  [6.6, 0.5, 0.53, 1], // décollage, puis vol : on suit l'avion
  [8.0, 0.5, 0.55, 1],
  [9.2, 0.5, 0.53, 1],
  [10.4, 0.5, 0.49, 1],
  [11.3, 0.5, 0.5, 1],
  [11.35, 0.52, 0.72, 1], // remise du colis à Conakry
  [11.6, 0.52, 0.72, 1],
  [12.2, 0.48, 0.8, 1],
  [12.8, 0.47, 0.78, 1],
  [13.4, 0.47, 0.86, 1],
  [14.0, 0.5, 0.75, 1],
  [14.4, 0.46, 0.6, 0], // gros plan final sur le logo
  [15.08, 0.45, 0.55, 0],
];

// Position du colis dans la vidéo à l'instant t (fractions 0–1 de la largeur / hauteur, et
// visibilité 0–1), interpolée entre les relevés ci-dessus.
function parcelInVideo(t: number) {
  const first = PARCEL_KEYS[0];
  const last = PARCEL_KEYS[PARCEL_KEYS.length - 1];
  if (t <= first[0]) return { x: first[1], y: first[2], a: first[3] };
  if (t >= last[0]) return { x: last[1], y: last[2], a: last[3] };
  let i = 0;
  while (PARCEL_KEYS[i + 1][0] < t) i++;
  const [t0, x0, y0, a0] = PARCEL_KEYS[i];
  const [t1, x1, y1, a1] = PARCEL_KEYS[i + 1];
  const k = (t - t0) / (t1 - t0);
  return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, a: a0 + (a1 - a0) * k };
}

// Taille de la vidéo affichée en « cover » dans un cadre w×h, et part visible sur chaque axe.
function coverGeometry(w: number, h: number) {
  const scale = Math.max(w / VIDEO_W, h / VIDEO_H, 0.0001);
  const vw = VIDEO_W * scale;
  const vh = VIDEO_H * scale;
  return { vw, vh, visibleX: Math.min(1, w / vw), visibleY: Math.min(1, h / vh) };
}

// Position (en %) qui centre le point c (0–1) dans la part visible d'un axe, fondue avec le
// cadrage manuel selon la visibilité a du colis.
function framingAxis(c: number, visible: number, manual: number, a: number) {
  if (a <= 0 || visible >= 1) return manual;
  const centered = Math.min(100, Math.max(0, ((c - visible / 2) / (1 - visible)) * 100));
  return manual + (centered - manual) * a;
}

export function VideoScrollStory({ onSimulateClick, ready }: VideoScrollStoryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress: p } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  // Scrub lissé : chaque image, le temps courant rattrape la cible de 22 % de l'écart. On ne
  // demande un nouveau seek que si le précédent est terminé (sinon les seeks s'empilent).
  const target = useRef(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoTime = useMotionValue(0); // temps réellement affiché par la vidéo (s)
  const frameW = useMotionValue(0);
  const frameH = useMotionValue(0);
  useMotionValueEvent(p, 'change', (v) => {
    target.current = v;
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let current = 0;
    let raf = 0;

    const tick = () => {
      const duration = video.duration;
      if (Number.isFinite(duration) && duration > 0) {
        const goal = target.current * (duration - 1 / 48);
        current += (goal - current) * 0.22;
        // On vise le milieu d'une image : viser sa frontière peut faire redécoder l'image
        // voisine. Et on ne saute que si on change réellement d'image (inutile sinon).
        const frame = Math.min(Math.round(duration * FPS) - 1, Math.max(0, Math.floor(current * FPS)));
        const t = (frame + 0.5) / FPS;
        if (!video.seeking && Math.abs(video.currentTime - t) > 0.5 / FPS) {
          video.currentTime = t;
        }
      }
      videoTime.set(video.currentTime);
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      video.pause();
      raf = requestAnimationFrame(tick);
    };
    if (video.readyState >= 1) start();
    else video.addEventListener('loadedmetadata', start, { once: true });

    // iOS Safari ignore `preload="auto"` et n'affiche aucune image d'une vidéo qui n'a jamais été
    // lue : au premier défilement, l'image disparaissait. On « débloque » donc la vidéo par un
    // play() immédiatement suivi d'un pause() (muette et inline, elle y est autorisée), dès le
    // chargement puis au premier geste de l'utilisateur si le navigateur l'avait refusé.
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      video
        .play()
        .then(() => {
          unlocked = true;
          video.pause();
        })
        .catch(() => {
          /* refusé (économie d'énergie, etc.) : on réessaie au prochain geste, le poster reste affiché */
        });
    };
    unlock();
    const gestures = ['touchstart', 'pointerdown', 'wheel', 'keydown'] as const;
    gestures.forEach((g) => window.addEventListener(g, unlock, { passive: true }));

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener('loadedmetadata', start);
      gestures.forEach((g) => window.removeEventListener(g, unlock));
    };
  }, [videoTime]);

  // Taille du cadre vidéo (pour placer le repère du colis)
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => {
      frameW.set(el.clientWidth);
      frameH.set(el.clientHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [frameW, frameH]);

  const progressScale = useTransform(p, [0, 1], [0, 1]);
  const hintOpacity = useTransform(p, [0, 0.03], [1, 0]);
  // La vidéo est en « cover » : sur un écran qui n'a pas le même format, une partie est coupée.
  // Dès que le colis est à l'image, le cadrage se centre dessus (fondu selon sa visibilité).
  const framing = useTransform(() => {
    const { visibleX, visibleY } = coverGeometry(frameW.get(), frameH.get());
    const { x, y, a } = parcelInVideo(videoTime.get());
    return {
      x: framingAxis(x, visibleX, MANUAL_FRAMING.x, a),
      y: framingAxis(y, visibleY, MANUAL_FRAMING.y, a),
    };
  });
  const objectPosition = useTransform(framing, (f) => `${f.x}% ${f.y}%`);
  // Travelling avant très lent sur toute la durée : l'image s'approche sans qu'on le remarque.
  const pushIn = useTransform(p, [0, 1], [1, 1.09]);

  return (
    <section
      ref={sectionRef}
      id="suivi"
      aria-label="Le voyage de votre colis"
      // La barre de menu (sticky, 65 px) se superpose à la vidéo : on remonte la section dessous
      // pour que la vidéo occupe tout l'écran dès le chargement.
      className="relative -mt-[65px] h-[700vh] bg-night-950"
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* Vidéo plein écran (horizontale 16:9, recadrée « cover ») */}
        {/* Le poster est aussi posé en fond : si le navigateur n'affiche pas (encore) l'image de la
            vidéo, on voit le poster plutôt qu'un écran vide. */}
        <div
          ref={frameRef}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${POSTER})` }}
        >
          <motion.video
            ref={videoRef}
            style={{ objectPosition, scale: pushIn }}
            src={VIDEO_SRC}
            poster={POSTER}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
          {/* Voiles : texte lisible à gauche sur ordinateur, en haut sur téléphone, barre du bas */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/15 to-black/75 lg:bg-gradient-to-r lg:from-black/80 lg:via-black/45 lg:to-black/5" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />
          {/* Vignette : assombrit légèrement les bords, comme un objectif de cinéma */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.5)_100%)]" />
        </div>

        {/* Textes */}
        <div className="relative z-10 h-full mx-auto max-w-7xl px-6 sm:px-12 pt-24 lg:pt-0 lg:flex lg:items-center pointer-events-none">
          <div className="relative h-[26rem] w-full max-w-md mx-auto lg:mx-0 lg:max-w-lg">
              {/* Accueil : première image de la vidéo + les deux actions principales */}
              <Chapter p={p} index={0} big ready={ready} eyebrow="Fret aérien Chine → Guinée"
                title="DSL Air Cargo"
                body="Vous achetez en Chine, on s'occupe du reste. Suivi WhatsApp, tarification claire dès 160 000 GNF/kg et zéro frais cachés."
              >
                <TrackingPanel onSimulateClick={onSimulateClick} />
              </Chapter>
              <Chapter p={p} index={1} eyebrow="01 — Guangzhou"
                title="Vous achetez. On récupère."
                body="Marchés, usines, fournisseurs : vos achats arrivent à notre entrepôt de Guangzhou."
              />
              <Chapter p={p} index={2} eyebrow="02 — Entrepôt de Guangzhou"
                title="Pesé, étiqueté, enregistré."
                body="Chaque colis est enregistré avec son poids réel et son prix au kilo, sans surprise."
              />
              <Chapter p={p} index={3} eyebrow="03 — En vol"
                title="Chargé dans l'avion pour Conakry."
                body="Vos colis voyagent par avion, et vous êtes prévenu par WhatsApp à chaque étape."
              />
              <Chapter p={p} index={4} eyebrow="04 — Madina, Conakry"
                title="Arrivé ? Vous êtes prévenu."
                body="Dès l'arrivée à notre entrepôt de Madina, vous recevez un message WhatsApp."
              >
                <WhatsAppNote p={p} />
              </Chapter>
              <Chapter p={p} index={5} eyebrow="05 — Livraison"
                title="Vous payez, vous récupérez."
                body="En espèces, par Orange Money ou par virement — puis remise du colis avec son bon de sortie."
              >
                <Magnetic className="mt-6 inline-block">
                  <button
                    type="button"
                    onClick={onSimulateClick}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-night-950 shadow-glow-sky transition hover:bg-emerald-400"
                  >
                    Simuler mon tarif <ArrowRight size={16} />
                  </button>
                </Magnetic>
              </Chapter>
          </div>
        </div>

        <motion.p
          style={{ opacity: hintOpacity }}
          className="absolute inset-x-0 bottom-40 sm:bottom-28 z-10 text-center text-xs uppercase tracking-[0.25em] text-white/70 pointer-events-none"
        >
          Faites défiler
        </motion.p>

        {/* Barre de progression par étape */}
        <div className="absolute inset-x-4 bottom-28 sm:bottom-14 z-10 mx-auto max-w-3xl pointer-events-none">
          <div className="flex justify-between font-label text-[10px] uppercase tracking-[0.2em] text-cream/60">
            {CHAPTERS.map((c) => (
              <span key={c.label}>{c.label}</span>
            ))}
          </div>
          <div className="mt-2 h-px w-full bg-cream/20">
            <motion.div className="h-px origin-left bg-ember-400" style={{ scaleX: progressScale }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Chapter({
  p,
  index,
  eyebrow,
  big,
  ready,
  title,
  body,
  children,
}: {
  p: MotionValue<number>;
  index: number;
  eyebrow: string;
  big?: boolean;
  ready?: boolean;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  const [a, b] = CHAPTERS[index].range;
  const first = index === 0;
  const last = index === CHAPTERS.length - 1;
  const input = first ? [0, b - 0.03, b] : last ? [a, a + 0.03, 1] : [a, a + 0.03, b - 0.03, b];
  const opacity = useTransform(p, input, first ? [1, 1, 0] : last ? [0, 1, 1] : [0, 1, 1, 0]);
  const y = useTransform(p, input, first ? [0, 0, -24] : last ? [24, 0, 0] : [24, 0, 0, -24]);
  // Seule l'étape visible reçoit les clics (le bouton de la dernière étape).
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? 'auto' : 'none'));
  // Mise au point : le texte arrive flou et se précise en apparaissant, repart flou en s'effaçant.
  // (« none » à pleine netteté : un filtre actif casserait le flou d'arrière-plan du panneau de suivi)
  const filter = useTransform(opacity, (o) => (o > 0.97 ? 'none' : `blur(${(1 - o) * 14}px)`));
  const stage = big ? ready : undefined;

  return (
    <motion.div style={{ opacity, y, pointerEvents, filter }} className="absolute inset-0 text-center lg:text-left">
      <Stage on={stage} delay={0.1}>
        <p className="font-label text-[11px] uppercase tracking-[0.3em] text-ember-300 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
          {eyebrow}
        </p>
      </Stage>
      <h2
        className={`mt-4 font-editorial font-normal tracking-tight text-cream [text-shadow:0_2px_30px_rgba(0,0,0,0.55)] ${
          big ? 'text-7xl sm:text-8xl leading-[0.95]' : 'text-5xl sm:text-6xl leading-[1.02]'
        }`}
      >
        {big ? <SplitLetters text={title} play={!!ready} delay={0.25} stagger={0.05} /> : title}
      </h2>
      <Stage on={stage} delay={0.9}>
        <p className="mt-5 text-sm sm:text-base leading-relaxed text-cream/80 [text-shadow:0_1px_12px_rgba(0,0,0,0.5)]">
          {body}
        </p>
      </Stage>
      <Stage on={stage} delay={1.15}>
        {children}
      </Stage>
    </motion.div>
  );
}

// Apparition échelonnée de l'écran d'accueil (fondu + légère montée) ; sans effet sur les
// autres étapes (on = undefined).
function Stage({ on, delay, children }: { on: boolean | undefined; delay: number; children: ReactNode }) {
  if (on === undefined) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function WhatsAppNote({ p }: { p: MotionValue<number> }) {
  const [a] = CHAPTERS[4].range;
  const opacity = useTransform(p, [a + 0.04, a + 0.07], [0, 1]);
  const scale = useTransform(p, [a + 0.04, a + 0.07], [0.92, 1]);
  return (
    <motion.div
      style={{ opacity, scale }}
      className="mt-5 mx-auto lg:mx-0 max-w-xs origin-top-left rounded-2xl rounded-tl-sm bg-white p-3.5 text-left shadow-card"
    >
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
        <MessageCircle size={13} /> DSL Air Cargo · WhatsApp
      </p>
      <p className="mt-1 text-sm text-night-900">
        Bonjour, votre colis <span className="font-semibold">DSL-2026-00137</span> est arrivé à Madina.
      </p>
    </motion.div>
  );
}
