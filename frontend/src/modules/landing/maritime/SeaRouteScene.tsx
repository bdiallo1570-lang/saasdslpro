import { useEffect, useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
} from 'framer-motion';
import { Anchor, Check } from 'lucide-react';
import { SplitLetters } from '../sections/motionKit';
import { MARITIME } from './maritimeConfig';
import { LAND_PATHS, MAP_HEIGHT, MAP_WIDTH, ROUTE_PATH, WAYPOINTS, project } from './seaMap';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Scène « traversée » : la section reste épinglée à l'écran pendant que le défilement fait
// avancer le cargo le long de la vraie route maritime. La route se trace derrière lui, les
// escales s'allument à son passage et le compteur de jours suit. Tout est piloté par une seule
// valeur (la progression du défilement), donc remonter fait reculer le bateau.
export function SeaRouteScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const shipRef = useRef<SVGGElement>(null);
  const [stops, setStops] = useState<number[]>(() => WAYPOINTS.map((_, i) => i / (WAYPOINTS.length - 1)));
  const [reached, setReached] = useState(0);
  const [started, setStarted] = useState(false);

  const { scrollYProgress } = useScroll({ target: sceneRef, offset: ['start start', 'end end'] });
  // Un peu de marge au début (lire le titre) et à la fin (voir l'arrivée) avant/après le trajet
  const raw = useTransform(scrollYProgress, [0.06, 0.9], [0, 1], { clamp: true });
  const route = useSpring(raw, { stiffness: 80, damping: 24, mass: 0.4 });
  const day = useTransform(route, (v) => Math.round(v * MARITIME.transitDays));
  const barWidth = useTransform(route, (v) => `${v * 100}%`);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  // Position de chaque escale le long du tracé, mesurée une fois sur le vrai chemin SVG
  useEffect(() => {
    const path = routeRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    const samples = Array.from({ length: 800 }, (_, i) => {
      const pt = path.getPointAtLength((i / 799) * total);
      return [pt.x, pt.y, i / 799] as const;
    });
    setStops(
      WAYPOINTS.map(({ lonLat }) => {
        const [x, y] = project(lonLat);
        let best = samples[0];
        for (const s of samples) {
          if ((s[0] - x) ** 2 + (s[1] - y) ** 2 < (best[0] - x) ** 2 + (best[1] - y) ** 2) best = s;
        }
        return best[2];
      }),
    );
    placeShip(0);
  }, []);

  function placeShip(v: number) {
    const path = routeRef.current;
    const ship = shipRef.current;
    if (!path || !ship) return;
    const total = path.getTotalLength();
    const at = Math.min(total - 0.5, Math.max(0, v * total));
    const a = path.getPointAtLength(at);
    const b = path.getPointAtLength(Math.min(total, at + 1.5));
    const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    ship.setAttribute('transform', `translate(${a.x.toFixed(2)} ${a.y.toFixed(2)}) rotate(${angle.toFixed(1)})`);
  }

  useMotionValueEvent(route, 'change', (v) => {
    placeShip(v);
    setStarted(v > 0.004);
    let idx = 0;
    stops.forEach((s, i) => {
      if (v >= s - 0.004) idx = i;
    });
    setReached((r) => (r === idx ? r : idx));
  });

  const arrived = reached === WAYPOINTS.length - 1;
  const current = WAYPOINTS[reached];
  const [cx, cy] = project(current.lonLat);

  return (
    <div ref={sceneRef} id="maritime" className="relative h-[330vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-[#030b14] text-cream">
        {/* Abysses : dégradé profond, halo bleu et vagues qui dérivent lentement */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_45%,rgba(14,116,144,0.28),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_15%_85%,rgba(245,158,11,0.10),transparent_70%)]" />
        <SeaWaves />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center gap-6 px-4 pt-16 sm:px-6 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] lg:items-center lg:gap-10 lg:pt-0">
          {/* Colonne texte */}
          <div className="relative">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 font-label text-[10px] uppercase tracking-[0.3em] text-cyan-200"
            >
              <Anchor size={12} />
              Nouveau · Fret maritime
            </motion.p>

            <h2 className="mt-5 font-editorial text-[2.6rem] leading-[0.98] tracking-tight sm:text-6xl xl:text-7xl">
              <SplitLetters text="Le grand large," inView stagger={0.03} />
              <br />
              <span className="italic text-cyan-200">
                <SplitLetters text="pour vos gros volumes." inView stagger={0.025} delay={0.25} />
              </span>
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-5 hidden max-w-md text-[15px] leading-relaxed text-slate-300/90 sm:block"
            >
              Meubles, machines, stock de boutique : quand le kilo coûte trop cher, le conteneur prend le relais.
              Facturé au mètre cube, de Guangzhou jusqu’à notre entrepôt de Madina.
            </motion.p>

            {/* Compteur de jours */}
            <div className="mt-6 lg:mt-10">
              <div className="flex items-end gap-3">
                <span className="font-label text-[11px] uppercase tracking-[0.25em] text-slate-400">Jour</span>
                <motion.span className="font-display text-5xl font-semibold tabular-nums leading-none sm:text-6xl">
                  {day}
                </motion.span>
                <span className="pb-1 font-label text-xs text-slate-400">
                  / {MARITIME.transitDays} · ≈ {MARITIME.transitLabel}
                </span>
              </div>
              <div className="mt-3 h-px w-full max-w-sm overflow-hidden bg-white/10">
                <motion.div style={{ width: barWidth }} className="h-full bg-gradient-to-r from-ember-400 to-cyan-300" />
              </div>
            </div>

            {/* Escale en cours */}
            {/* Fondu enchaîné (les deux libellés sont superposés) : pas de mode « wait », qui se
                bloque quand le défilement rapide change l'escale plusieurs fois de suite */}
            <div className="relative mt-5 h-16 max-w-sm">
              <AnimatePresence initial={false}>
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
                  transition={{ duration: 0.45, ease: EASE_OUT }}
                  className="absolute inset-0"
                >
                  <p className="flex items-center gap-2 text-lg font-medium text-white">
                    {arrived && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-ink-950">
                        <Check size={13} strokeWidth={3} />
                      </span>
                    )}
                    {current.label}
                  </p>
                  <p className="text-sm text-slate-400">{current.detail}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-2 hidden gap-1.5 lg:flex">
              {WAYPOINTS.map((w, i) => (
                <span
                  key={w.id}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i <= reached ? 'w-8 bg-cyan-300' : 'w-4 bg-white/15'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Carte */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 1.4, ease: EASE_OUT }}
            className="relative"
          >
            <svg
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              className="h-auto w-full overflow-visible"
              role="img"
              aria-label={`Route maritime de Guangzhou à Conakry par le Cap de Bonne-Espérance, environ ${MARITIME.transitLabel}`}
            >
              <defs>
                <pattern id="sea-dots" width="7" height="7" patternUnits="userSpaceOnUse">
                  <circle cx="3.5" cy="3.5" r="1.25" fill="#EDE7DB" fillOpacity="0.32" />
                </pattern>
                <linearGradient id="sea-route" x1="1" y1="0" x2="0" y2="0">
                  <stop offset="0%" stopColor="#FFB35C" />
                  <stop offset="55%" stopColor="#67E8F9" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
                <filter id="sea-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" />
                </filter>
                <radialGradient id="sea-halo">
                  <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#67E8F9" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Parallèles (équateur plus marqué) */}
              {[-20, 0, 20].map((lat) => {
                const y = project([0, lat])[1];
                return (
                  <line
                    key={lat}
                    x1="0"
                    x2={MAP_WIDTH}
                    y1={y}
                    y2={y}
                    stroke="#EDE7DB"
                    strokeOpacity={lat === 0 ? 0.12 : 0.05}
                    strokeDasharray="2 8"
                  />
                );
              })}

              {LAND_PATHS.map((d, i) => (
                <path key={i} d={d} fill="url(#sea-dots)" />
              ))}

              {/* Route complète en pointillés, puis la portion parcourue (lueur + trait) */}
              <path d={ROUTE_PATH} fill="none" stroke="#EDE7DB" strokeOpacity="0.18" strokeWidth="1.5" strokeDasharray="3 7" />
              <motion.path
                d={ROUTE_PATH}
                fill="none"
                stroke="url(#sea-route)"
                strokeWidth="7"
                strokeLinecap="round"
                filter="url(#sea-glow)"
                opacity={0.55}
                style={{ pathLength: route }}
              />
              <motion.path
                ref={routeRef}
                d={ROUTE_PATH}
                fill="none"
                stroke="url(#sea-route)"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ pathLength: route }}
              />

              {/* Escales */}
              {WAYPOINTS.map((w, i) => {
                const [x, y] = project(w.lonLat);
                const lit = started && i <= reached;
                const port = i === 0 || i === WAYPOINTS.length - 1;
                return (
                  <g key={w.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r={port ? 6 : 4.5}
                      fill={lit || port ? (port ? '#FFB35C' : '#67E8F9') : '#030b14'}
                      stroke={port ? '#FFB35C' : '#67E8F9'}
                      strokeOpacity={lit || port ? 1 : 0.45}
                      strokeWidth="1.5"
                      style={{ transition: 'fill 0.5s ease, stroke-opacity 0.5s ease' }}
                    />
                    {port && (
                      <circle cx={x} cy={y} r="6" fill="none" stroke="#FFB35C" strokeWidth="1">
                        <animate attributeName="r" values="6;20" dur="2.4s" repeatCount="indefinite" />
                        <animate attributeName="stroke-opacity" values="0.8;0" dur="2.4s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* Étiquettes des deux ports */}
              <PortLabel x={project(WAYPOINTS[0].lonLat)[0]} y={project(WAYPOINTS[0].lonLat)[1]} title="GUANGZHOU" sub="Chine" align="end" />
              <PortLabel x={project(WAYPOINTS[5].lonLat)[0]} y={project(WAYPOINTS[5].lonLat)[1]} title="CONAKRY" sub="Guinée" align="start" />

              {/* Repère de l'escale atteinte */}
              {started && reached > 0 && reached < WAYPOINTS.length - 1 && (
                <motion.g key={current.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                  <circle cx={cx} cy={cy} r="14" fill="none" stroke="#67E8F9" strokeOpacity="0.6" strokeWidth="1">
                    <animate attributeName="r" values="5;18" dur="1.6s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.8;0" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                </motion.g>
              )}

              {/* Le cargo (vu de dessus) : halo, sillage sonar, coque et conteneurs */}
              <g ref={shipRef}>
                <circle r="26" fill="url(#sea-halo)" />
                <circle r="8" fill="none" stroke="#67E8F9" strokeWidth="1">
                  <animate attributeName="r" values="8;30" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.7;0" dur="2s" repeatCount="indefinite" />
                </circle>
                <path d="M-13,-5 L7,-5 Q14,-5 17,0 Q14,5 7,5 L-13,5 Q-15,0 -13,-5 Z" fill="#EDE7DB" />
                <rect x="-10" y="-3" width="4.5" height="6" rx="0.6" fill="#F59E0B" />
                <rect x="-4.6" y="-3" width="4.5" height="6" rx="0.6" fill="#0EA5E9" />
                <rect x="0.8" y="-3" width="4.5" height="6" rx="0.6" fill="#10B981" />
                <rect x="7" y="-2.2" width="3" height="4.4" rx="0.6" fill="#030b14" />
              </g>
            </svg>

            <AnimatePresence>
              {arrived && (
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.6, ease: EASE_OUT }}
                  className="absolute bottom-[4%] right-[2%] rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 backdrop-blur-md"
                >
                  <p className="text-sm font-semibold text-emerald-200">Arrivé à Conakry</p>
                  <p className="text-xs text-emerald-100/70">Dédouanement, puis retrait à l’entrepôt de Madina</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <motion.div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2 font-label text-[10px] uppercase tracking-[0.3em] text-slate-400"
        >
          Faites défiler pour lever l’ancre ↓
        </motion.div>
      </div>
    </div>
  );
}

function PortLabel({ x, y, title, sub, align }: { x: number; y: number; title: string; sub: string; align: 'start' | 'end' }) {
  const dx = align === 'end' ? -14 : 14;
  return (
    <g>
      <text x={x + dx} y={y - 4} textAnchor={align} fill="#EDE7DB" fontSize="15" fontFamily="JetBrains Mono Variable, monospace" letterSpacing="3">
        {title}
      </text>
      <text x={x + dx} y={y + 14} textAnchor={align} fill="#94A3B8" fontSize="12" fontFamily="Plus Jakarta Sans Variable, sans-serif">
        {sub}
      </text>
    </g>
  );
}

// Trois houles très fines qui dérivent en boucle au bas de la scène (CSS seul, aucun JS)
function SeaWaves() {
  const wave = 'M0,20 C150,0 350,40 500,20 C650,0 850,40 1000,20 C1150,0 1350,40 1500,20 C1650,0 1850,40 2000,20';
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 overflow-hidden opacity-60">
      {[
        { bottom: 70, dur: '26s', op: 0.1 },
        { bottom: 40, dur: '19s', op: 0.16 },
        { bottom: 12, dur: '14s', op: 0.24 },
      ].map((w, i) => (
        <svg
          key={i}
          viewBox="0 0 2000 40"
          preserveAspectRatio="none"
          className="absolute left-0 h-10 w-[200%] animate-[sea-drift_linear_infinite]"
          style={{ bottom: w.bottom, animationDuration: w.dur }}
        >
          <path d={wave} fill="none" stroke="#67E8F9" strokeOpacity={w.op} strokeWidth="1.2" />
        </svg>
      ))}
    </div>
  );
}
