import { ReactNode, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, MessageCircle, Package, Sofa, Luggage, Layers, Stamp } from 'lucide-react';
import { StatCounter } from '@/ui';
import { Magnetic } from '../sections/motionKit';
import { Container3D } from './Container3D';
import { CONTAINERS, MARITIME } from './maritimeConfig';
import { formatNumber } from '@/lib/format';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const PRESETS = [
  { label: 'Carton', icon: Package, l: 60, w: 40, h: 40 },
  { label: 'Valise', icon: Luggage, l: 75, w: 50, h: 30 },
  { label: 'Canapé', icon: Sofa, l: 200, w: 90, h: 80 },
  { label: 'Palette', icon: Layers, l: 120, w: 80, h: 150 },
];

function formatM3(v: number) {
  return formatNumber(v, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Calculateur de volume maritime : dimensions d'un colis × quantité → m³. Le conteneur 3D se
// remplit en direct ; au-delà d'un 20 pieds on bascule sur un 40 pieds, puis sur plusieurs.
// Le devis part sur WhatsApp, déjà rédigé avec les dimensions et le volume.
export function CbmCalculator({ isDark }: { isDark: boolean }) {
  const [dims, setDims] = useState({ l: 60, w: 40, h: 40 });
  const [qty, setQty] = useState(120);

  const volume = useMemo(() => (dims.l * dims.w * dims.h * qty) / 1_000_000, [dims, qty]);

  const big = CONTAINERS[1];
  const container = volume <= CONTAINERS[0].capacity ? CONTAINERS[0] : big;
  const count = volume > big.capacity ? Math.ceil(volume / big.capacity) : 1;
  const fill = count > 1 ? 1 : volume / container.capacity;
  const percent = Math.round((volume / (container.capacity * count)) * 100);
  const estimate = MARITIME.pricePerCbmUsd ? volume * MARITIME.pricePerCbmUsd : null;
  const [withCustoms, setWithCustoms] = useState(false);
  const customsEstimate = MARITIME.customsPerCbmGnf ? volume * MARITIME.customsPerCbmGnf : null;

  const message =
    `Bonjour DSL, je souhaite un devis pour le fret maritime Chine → Conakry :\n` +
    `• ${qty} colis de ${dims.l} × ${dims.w} × ${dims.h} cm\n` +
    `• Volume total : ${formatM3(volume)} m³` +
    (withCustoms ? `\n• Avec dédouanement à Conakry` : '');
  const whatsappUrl = `https://wa.me/${MARITIME.whatsappNumber}?text=${encodeURIComponent(message)}`;

  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const strong = isDark ? 'text-white' : 'text-night-900';

  return (
    <motion.div
      id="devis-maritime"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, ease: EASE_OUT }}
      className={`overflow-hidden rounded-[1.75rem] border ${
        isDark ? 'border-white/10 bg-ink-950' : 'border-slate-200 bg-white shadow-xl'
      }`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Saisie */}
        <div className="p-6 sm:p-10">
          <p className={`font-label text-[11px] uppercase tracking-[0.25em] ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
            Calculateur de volume
          </p>
          <p className={`mt-2 font-editorial text-3xl sm:text-4xl ${strong}`}>Combien de place pour votre marchandise ?</p>

          <p className={`mt-6 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Partir d’un modèle</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {PRESETS.map((p) => {
              const Icon = p.icon;
              const active = dims.l === p.l && dims.w === p.w && dims.h === p.h;
              return (
                <motion.button
                  key={p.label}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDims({ l: p.l, w: p.w, h: p.h })}
                  className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors ${
                    active
                      ? isDark
                        ? 'border-cyan-300/60 text-cyan-200'
                        : 'border-cyan-600 text-cyan-800'
                      : isDark
                        ? 'border-white/10 text-slate-300 hover:border-white/25'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="cbm-preset"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className={`absolute inset-0 -z-0 rounded-xl ${isDark ? 'bg-cyan-400/10' : 'bg-cyan-50'}`}
                    />
                  )}
                  <Icon size={18} className="relative" />
                  <span className="relative">{p.label}</span>
                </motion.button>
              );
            })}
          </div>

          <p className={`mt-6 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Dimensions d’un colis (cm)</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(
              [
                ['l', 'Longueur'],
                ['w', 'Largeur'],
                ['h', 'Hauteur'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className={`rounded-xl border px-3 py-2 transition-colors focus-within:border-cyan-400 ${
                  isDark ? 'border-white/10 bg-ink-900' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <span className={`block text-[11px] ${muted}`}>{label}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={dims[key] || ''}
                  onChange={(e) => setDims((d) => ({ ...d, [key]: Math.max(0, Number(e.target.value) || 0) }))}
                  className={`w-full bg-transparent text-lg font-semibold tabular-nums outline-none ${strong}`}
                />
              </label>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Nombre de colis</p>
            <div className={`flex items-center rounded-full border ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <Stepper onClick={() => setQty((q) => Math.max(1, q - 1))} label="Retirer un colis" isDark={isDark}>
                <Minus size={15} />
              </Stepper>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={qty || ''}
                onChange={(e) => setQty(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                className={`w-16 bg-transparent text-center text-lg font-semibold tabular-nums outline-none ${strong}`}
                aria-label="Nombre de colis"
              />
              <Stepper onClick={() => setQty((q) => q + 1)} label="Ajouter un colis" isDark={isDark}>
                <Plus size={15} />
              </Stepper>
            </div>
          </div>

          {/* Option dédouanement, facturée à part en GNF */}
          <button
            type="button"
            role="switch"
            aria-checked={withCustoms}
            onClick={() => setWithCustoms((v) => !v)}
            className={`mt-6 flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors ${
              withCustoms
                ? isDark
                  ? 'border-cyan-300/60 bg-cyan-400/10'
                  : 'border-cyan-600 bg-cyan-50'
                : isDark
                  ? 'border-white/10 hover:border-white/25'
                  : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span>
              <span className={`flex items-center gap-2 text-sm font-medium ${strong}`}>
                <Stamp size={16} className={isDark ? 'text-cyan-300' : 'text-cyan-700'} />
                Ajouter le dédouanement à Conakry
              </span>
              <span className={`mt-0.5 block text-xs ${muted}`}>
                {MARITIME.customsPerCbmGnf
                  ? `${formatNumber(MARITIME.customsPerCbmGnf)} GNF / m³, facturé à part du fret`
                  : 'Facturé à part du fret, en francs guinéens · tarif sur devis'}
              </span>
            </span>
            <span
              className={`flex h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${
                withCustoms ? 'justify-end bg-cyan-400' : isDark ? 'justify-start bg-white/15' : 'justify-start bg-slate-300'
              }`}
            >
              <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 34 }} className="h-5 w-5 rounded-full bg-white shadow" />
            </span>
          </button>
        </div>

        {/* Résultat */}
        <div
          className={`relative flex flex-col justify-between gap-6 p-6 sm:p-10 ${
            isDark
              ? 'bg-[radial-gradient(ellipse_at_50%_40%,rgba(14,116,144,0.35),transparent_70%)] lg:border-l lg:border-white/10'
              : 'bg-gradient-to-b from-cyan-50 to-white lg:border-l lg:border-slate-200'
          }`}
        >
          <Container3D fill={fill} isDark={isDark} />

          <div className="text-center">
            <p className={`text-xs font-medium uppercase tracking-[0.2em] ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
              Volume total
            </p>
            <p className={`mt-1 font-display text-5xl font-semibold tabular-nums ${strong}`}>
              <StatCounter value={volume} duration={0.6} formatter={formatM3} />
              <span className="ml-2 text-xl font-medium opacity-70">m³</span>
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={`${container.id}-${count}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className={`mt-2 text-sm ${muted}`}
              >
                {count > 1
                  ? `${count} × ${container.label.toLowerCase()} · rempli à ${percent} %`
                  : `≈ ${percent} % d’un ${container.label.toLowerCase()} (${container.capacity} m³)`}
              </motion.p>
            </AnimatePresence>
            {estimate !== null && (
              <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Fret :{' '}
                <span className={`font-semibold ${strong}`}>
                  <StatCounter value={estimate} duration={0.6} /> USD
                </span>{' '}
                <span className={muted}>({MARITIME.pricePerCbmUsd} USD/m³, indicatif)</span>
              </p>
            )}
            <AnimatePresence initial={false}>
              {withCustoms && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: EASE_OUT }}
                  className={`overflow-hidden text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                >
                  <span className="block pt-1.5">
                    + Dédouanement :{' '}
                    {customsEstimate !== null ? (
                      <span className={`font-semibold ${strong}`}>
                        <StatCounter value={customsEstimate} duration={0.6} /> GNF
                      </span>
                    ) : (
                      <span className={`font-semibold ${strong}`}>sur devis, en GNF</span>
                    )}
                  </span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div>
            <Magnetic strength={0.18}>
              <motion.a
                href={volume > 0 ? whatsappUrl : undefined}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-disabled={volume <= 0}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-semibold text-ink-950 shadow-[0_10px_40px_-10px_rgba(103,232,249,0.7)] transition-colors sm:text-base ${
                  volume > 0 ? 'bg-cyan-300 hover:bg-cyan-200' : 'pointer-events-none bg-slate-500/40'
                }`}
              >
                <MessageCircle size={18} />
                Recevoir mon devis sur WhatsApp
              </motion.a>
            </Magnetic>
            <p className={`mt-3 text-center text-xs ${muted}`}>
              Délai indicatif ≈ {MARITIME.transitLabel} · message pré-rempli avec vos dimensions
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Stepper({ onClick, label, isDark, children }: { onClick: () => void; label: string; isDark: boolean; children: ReactNode }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
        isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </motion.button>
  );
}
