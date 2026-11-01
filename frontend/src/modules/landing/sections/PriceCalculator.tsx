import { useState, useMemo, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ShieldAlert, MapPin } from 'lucide-react';
import { WarehouseAddressModal } from '@/modules/warehouses/WarehouseAddressModal';
import { StatCounter } from '@/ui';
import { AuroraBackground } from './AuroraBackground';
import { SectionHeading } from './SectionHeading';
import { Magnetic } from './motionKit';
import { formatNumber } from '@/lib/format';
import { formatPricePerKg, priceOf, usePublicPricing } from '../publicPricing';

interface PriceCalculatorProps {
  isDark: boolean;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Catégories publiées sur la landing. Le prix au kilo n'est PAS ici : il est lu en base
// (voir publicPricing.ts), puis le calcul reste 100 % local, instantané à chaque mouvement.
const CATEGORIES = [
  {
    value: 'STANDARD' as const,
    label: 'Cargo Standard',
    icon: Package,
    examples: 'Habits, chaussures, petits accessoires, jouets, vaisselle, articles ménagers…',
    // Couleur d'accent de la catégorie : curseur, colis de la soute, halo du résultat
    accent: '#10B981',
    accentSoft: 'rgba(16,185,129,0.14)',
  },
  {
    value: 'RISQUE' as const,
    label: 'Cargo Sensible',
    icon: ShieldAlert,
    examples: 'Batteries, liquides, produits électroniques, cosmétiques, produits inflammables…',
    accent: '#F59E0B',
    accentSoft: 'rgba(245,158,11,0.16)',
  },
];

const MIN_KG = 0.5;
const MAX_KG = 200;
// Un emplacement de la soute = 10 kg : 20 emplacements couvrent toute la plage du curseur
const SLOT_KG = 10;
const SLOTS = MAX_KG / SLOT_KG;

export const PriceCalculator = forwardRef<HTMLDivElement, PriceCalculatorProps>(({ isDark }, ref) => {
  const [categorie, setCategorie] = useState<'STANDARD' | 'RISQUE'>('STANDARD');
  const [poidsKg, setPoidsKg] = useState(5);
  const [dragging, setDragging] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const pricing = usePublicPricing();
  const selectedCategorie = CATEGORIES.find((c) => c.value === categorie)!;
  const pricePerKg = priceOf(pricing, categorie);
  const totalEstime = useMemo(
    () => (poidsKg > 0 && pricePerKg !== null ? poidsKg * pricePerKg : 0),
    [poidsKg, pricePerKg],
  );

  const accent = selectedCategorie.accent;
  const sliderPct = (Math.min(Math.max(poidsKg, MIN_KG), MAX_KG) - MIN_KG) / (MAX_KG - MIN_KG);
  const filledSlots = poidsKg > 0 ? Math.min(SLOTS, Math.ceil(poidsKg / SLOT_KG)) : 0;
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const strong = isDark ? 'text-white' : 'text-night-900';

  return (
    <section
      id="calculateur"
      ref={ref}
      className={`relative overflow-hidden pt-20 pb-36 sm:py-28 transition-colors duration-300 ${
        isDark ? 'bg-ink-900' : 'bg-slate-50'
      }`}
    >
      <AuroraBackground isDark={isDark} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <SectionHeading
          isDark={isDark}
          eyebrow="Nos tarifs"
          title="Calculez le prix de votre envoi en direct"
          description="Aucune surprise : le tarif au kilo est fixe et transparent, affiché avant même votre première expédition."
          className="mb-12"
        />

        {/* Entrée : la carte s'ouvre depuis le centre (zoom par clip-path), puis les deux colonnes
            glissent depuis les côtés. Le clip-path est retiré à la fin pour ne pas rogner l'ombre. */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            hidden: { clipPath: 'inset(14% 8% 14% 8% round 2.5rem)', scale: 0.96, opacity: 0 },
            show: {
              clipPath: 'inset(0% 0% 0% 0% round 1.5rem)',
              scale: 1,
              opacity: 1,
              transition: { duration: 1.1, ease: EASE_OUT, staggerChildren: 0.12, delayChildren: 0.25 },
              transitionEnd: { clipPath: 'none' },
            },
          }}
          className={`relative overflow-hidden rounded-3xl border p-6 sm:p-10 shadow-xl ${
            isDark ? 'bg-ink-950 border-white/10' : 'bg-white border-slate-200'
          }`}
        >
          {/* Halo d'ambiance qui prend la couleur de la catégorie choisie */}
          <motion.div
            aria-hidden="true"
            animate={{ backgroundColor: selectedCategorie.accentSoft }}
            transition={{ duration: 0.8 }}
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full blur-3xl"
          />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Contrôles */}
            <motion.div variants={slideIn(-36)}>
              <p className={`text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Catégorie de marchandise
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = categorie === cat.value;
                  return (
                    <motion.button
                      key={cat.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategorie(cat.value)}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative text-left rounded-2xl border-2 p-4 transition-colors ${
                        isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Cadre actif partagé : il glisse d'une carte à l'autre en changeant de couleur */}
                      {active && (
                        <motion.span
                          layoutId="calculator-active-frame"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          className="absolute -inset-[2px] rounded-2xl border-2"
                          style={{ borderColor: cat.accent, backgroundColor: cat.accentSoft }}
                        />
                      )}
                      <motion.span
                        className="relative inline-flex"
                        animate={active ? { rotate: [0, -14, 10, 0], scale: 1.15 } : { rotate: 0, scale: 1 }}
                        transition={{ duration: 0.5, ease: EASE_OUT }}
                      >
                        <Icon size={20} style={{ color: active ? cat.accent : undefined }} className="text-slate-400" />
                      </motion.span>
                      <p className={`relative mt-2 font-semibold text-sm ${strong}`}>{cat.label}</p>
                      <p className={`relative text-xs mt-0.5 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        <PriceTag value={priceOf(pricing, cat.value)} failed={pricing.status === 'error'} />
                      </p>
                      <p className={`relative text-[11px] mt-1.5 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{cat.examples}</p>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mb-2">
                <label htmlFor="calculateur-poids" className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Poids estimé
                </label>
                <span className={`text-sm font-bold tabular-nums ${strong}`}>
                  <RollingText value={`${formatNumber(poidsKg)} kg`} />
                </span>
              </div>

              {/* Curseur : bulle de poids qui suit le pouce et grossit pendant le glissement */}
              <div className="relative pt-9">
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0"
                  style={{ left: `calc(${sliderPct * 100}% + ${9 - sliderPct * 18}px)`, x: '-50%' }}
                  animate={{ scale: dragging ? 1.12 : 1, y: dragging ? -3 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                >
                  <motion.span
                    animate={{ backgroundColor: accent }}
                    transition={{ duration: 0.5 }}
                    className="relative block whitespace-nowrap rounded-lg px-2 py-0.5 text-xs font-bold tabular-nums text-ink-950 shadow-lg"
                  >
                    {formatNumber(poidsKg)} kg
                    <motion.span
                      animate={{ backgroundColor: accent }}
                      transition={{ duration: 0.5 }}
                      className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45"
                    />
                  </motion.span>
                </motion.div>
                <input
                  id="calculateur-poids"
                  data-cursor-label="Glisser"
                  type="range"
                  min={MIN_KG}
                  max={MAX_KG}
                  step={0.5}
                  value={poidsKg}
                  onChange={(e) => setPoidsKg(Number(e.target.value))}
                  onPointerDown={() => setDragging(true)}
                  onPointerUp={() => setDragging(false)}
                  onPointerCancel={() => setDragging(false)}
                  onBlur={() => setDragging(false)}
                  className="calculator-slider w-full"
                  style={
                    {
                      '--thumb': accent,
                      background: `linear-gradient(to right, ${accent} ${sliderPct * 100}%, ${
                        isDark ? '#1E293B' : '#E2E8F0'
                      } ${sliderPct * 100}%)`,
                    } as React.CSSProperties
                  }
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className={muted}>{formatNumber(MIN_KG)} kg</span>
                <span className={muted}>{MAX_KG} kg</span>
              </div>

              <input
                type="number"
                min={0.1}
                step={0.1}
                value={poidsKg}
                aria-label="Poids estimé en kilos"
                onChange={(e) => setPoidsKg(Number(e.target.value) || 0)}
                className={`mt-4 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 ${
                  isDark ? 'bg-ink-900 border-white/10 text-white' : 'bg-white border-slate-200 text-night-900'
                }`}
              />
            </motion.div>

            {/* Résultat */}
            <motion.div variants={slideIn(36)} className="flex flex-col justify-between gap-6">
              <CargoHold filled={filledSlots} accent={accent} isDark={isDark} />

              <div
                className={`relative overflow-hidden rounded-2xl border p-6 text-center ${
                  isDark
                    ? 'bg-gradient-to-br from-white/[0.04] to-sky-500/10 border-white/10'
                    : 'bg-gradient-to-br from-slate-50 to-sky-50 border-slate-200'
                }`}
              >
                {/* Teinte de la catégorie, en fondu */}
                <motion.div
                  aria-hidden="true"
                  animate={{ backgroundColor: selectedCategorie.accentSoft }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0"
                />
                {/* Reflet qui balaie la carte à chaque changement de catégorie */}
                <motion.span
                  key={categorie}
                  aria-hidden="true"
                  initial={{ x: '-120%' }}
                  animate={{ x: '120%' }}
                  transition={{ duration: 1, ease: EASE_OUT }}
                  className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                />

                <motion.p
                  animate={{ color: accent }}
                  transition={{ duration: 0.5 }}
                  className="relative text-xs font-medium uppercase tracking-wide"
                >
                  Prix total estimé
                </motion.p>
                <p className={`relative mt-2 text-4xl font-extrabold tabular-nums ${strong}`}>
                  {pricePerKg === null ? (
                    pricing.status === 'error' ? (
                      '—'
                    ) : (
                      <span className="inline-block h-9 w-56 max-w-full animate-pulse rounded-lg bg-current opacity-10 align-middle" />
                    )
                  ) : poidsKg > 0 ? (
                    <StatCounter value={totalEstime} duration={0.6} />
                  ) : (
                    '—'
                  )}
                  <span className="text-lg font-semibold ml-1">GNF</span>
                </p>
                <AnimatePresence mode="wait" initial={false}>
                  {poidsKg > 0 && pricePerKg !== null && (
                    <motion.p
                      key={categorie}
                      initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                      transition={{ duration: 0.3, ease: EASE_OUT }}
                      className={`relative text-xs mt-2 tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                    >
                      {formatNumber(poidsKg)} kg × {formatNumber(pricePerKg)} GNF/kg
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <Magnetic strength={0.18}>
                <motion.button
                  type="button"
                  whileHover="hover"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAddressModalOpen(true)}
                  className="group relative w-full overflow-hidden inline-flex items-center justify-center gap-2 bg-cargo-500 hover:bg-cargo-400 text-ink-950 text-sm sm:text-base font-semibold px-4 sm:px-5 py-3.5 rounded-xl shadow-glow-cargo transition-colors"
                >
                  {/* Reflet au survol */}
                  <motion.span
                    aria-hidden="true"
                    variants={{ hover: { x: ['-120%', '220%'] } }}
                    initial={{ x: '-120%' }}
                    transition={{ duration: 0.9, ease: EASE_OUT }}
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                  <motion.span
                    className="relative inline-flex"
                    variants={{ hover: { y: [0, -4, 0] } }}
                    transition={{ duration: 0.5, ease: EASE_OUT }}
                  >
                    <MapPin size={17} />
                  </motion.span>
                  <span className="relative">Adresses d'expédition en Chine</span>
                </motion.button>
              </Magnetic>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <WarehouseAddressModal open={addressModalOpen} onClose={() => setAddressModalOpen(false)} />
    </section>
  );
});
PriceCalculator.displayName = 'PriceCalculator';

// Colonne qui glisse depuis le côté en passant du flou au net (filtre retiré à la fin)
function slideIn(x: number) {
  return {
    hidden: { opacity: 0, x, filter: 'blur(8px)' },
    show: {
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.9, ease: EASE_OUT },
      transitionEnd: { filter: 'none' },
    },
  };
}

// Texte dont chaque nouvelle valeur remonte, l'ancienne s'échappant vers le haut
function RollingText({ value }: { value: string }) {
  return (
    <span className="relative inline-flex overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.22, ease: EASE_OUT }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Soute d'avion vue de profil : chaque tranche de 10 kg ajoute un colis qui tombe dans la soute
// (rangée du bas d'abord). L'avion flotte doucement, comme en vol.
function CargoHold({ filled, accent, isDark }: { filled: number; accent: string; isDark: boolean }) {
  const hull = isDark ? 'border-white/15 bg-ink-900' : 'border-slate-300 bg-white';
  const ghost = isDark ? 'border-white/10' : 'border-slate-200';

  return (
    <div aria-hidden="true">
      <motion.div
        animate={{ y: [0, -4, 0], rotate: [0, -0.6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mx-auto h-32 w-full max-w-md"
      >
        {/* Dérive */}
        <svg viewBox="0 0 60 50" className="absolute left-1 top-0 h-12 w-14">
          <path
            d="M6 50 L20 6 Q22 2 26 2 L34 2 L40 50 Z"
            className={isDark ? 'fill-white/[0.06] stroke-white/15' : 'fill-white stroke-slate-300'}
            strokeWidth="1.5"
          />
        </svg>

        {/* Aile, derrière le fuselage */}
        <svg viewBox="0 0 120 30" className="absolute bottom-0 left-[38%] h-8 w-32">
          <path
            d="M0 4 L70 4 L120 28 L96 28 Z"
            className={isDark ? 'fill-ink-900 stroke-white/15' : 'fill-slate-100 stroke-slate-300'}
            strokeWidth="1.5"
          />
        </svg>

        {/* Fuselage : arrière effilé à gauche, nez arrondi à droite */}
        <div className={`absolute bottom-5 left-0 right-0 h-20 rounded-l-[1.5rem] rounded-r-[999px] border ${hull}`}>
          {/* Hublots */}
          <div className="absolute left-12 right-16 top-2.5 flex justify-between">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className={`h-1.5 w-2 rounded-full ${isDark ? 'bg-sky-300/40' : 'bg-sky-400/50'}`} />
            ))}
          </div>
          {/* Cockpit */}
          <span className={`absolute right-5 top-3 h-2.5 w-5 rounded-tr-full ${isDark ? 'bg-sky-300/50' : 'bg-sky-400/60'}`} />

          {/* Pont cargo : 2 rangées × 10 emplacements */}
          <div className="absolute bottom-2 left-8 right-14 grid h-11 grid-cols-10 grid-rows-2 gap-1">
            {Array.from({ length: SLOTS }, (_, i) => {
              const row = i < SLOTS / 2 ? 2 : 1;
              const col = (i % (SLOTS / 2)) + 1;
              return (
                <div
                  key={i}
                  style={{ gridRow: row, gridColumn: col }}
                  className={`relative rounded-[3px] border border-dashed ${ghost}`}
                >
                  <AnimatePresence>
                    {i < filled && (
                      <motion.span
                        initial={{ y: -26, opacity: 0, rotate: -18, scale: 0.6 }}
                        animate={{ y: 0, opacity: 1, rotate: 0, scale: 1, backgroundColor: accent }}
                        exit={{ y: -14, opacity: 0, scale: 0.6, transition: { duration: 0.18 } }}
                        transition={{ type: 'spring', stiffness: 520, damping: 22, backgroundColor: { duration: 0.5 } }}
                        className="absolute -inset-px rounded-[3px] shadow-sm"
                      >
                        {/* Ruban adhésif */}
                        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-black/20" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </motion.div>
    </div>
  );
}

// Prix au kilo d'une catégorie : forme animée pendant le chargement, message si le serveur ne répond pas
function PriceTag({ value, failed }: { value: number | null; failed: boolean }) {
  if (value !== null) return <>{formatPricePerKg(value)}</>;
  if (failed) return <>Tarif sur demande</>;
  return <span className="inline-block h-3 w-24 animate-pulse rounded bg-current align-middle opacity-20" />;
}
