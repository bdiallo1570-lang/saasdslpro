import { motion } from 'framer-motion';
import { Plane, Ship, Clock, Scale, Boxes, Receipt, Stamp } from 'lucide-react';
import { Spotlight, Tilt } from '@/ui';
import { MARITIME } from './maritimeConfig';
import { formatNumber } from '@/lib/format';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const ROWS = [
  { icon: Clock, label: 'Délai', air: 'Le plus rapide', sea: `≈ ${MARITIME.transitLabel}` },
  { icon: Scale, label: 'Facturation', air: 'Au kilo (poids réel)', sea: 'Au mètre cube (CBM)' },
  { icon: Boxes, label: 'Idéal pour', air: 'Petits colis, urgences, e-commerce', sea: 'Meubles, machines, stock, gros volumes' },
  {
    icon: Receipt,
    label: 'Tarif',
    air: 'Prix fixe au kilo, tout compris',
    sea: MARITIME.pricePerCbmUsd ? `${formatNumber(MARITIME.pricePerCbmUsd)} USD / m³ (fret)` : 'Sur devis, réponse rapide',
  },
  { icon: Stamp, label: 'Dédouanement', air: 'Inclus dans le prix au kilo', sea: 'Facturé à part, en GNF' },
];

// Deux cartes côte à côte. La carte « Bateau » porte une bordure lumineuse qui tourne en
// continu (dégradé conique animé en CSS via @property, voir index.css).
export function AirVsSea({ isDark }: { isDark: boolean }) {
  const cards = [
    { key: 'air', title: 'Avion', icon: Plane, tagline: 'Quand chaque jour compte', featured: false, photo: '/images/freight/hold.jpg' },
    { key: 'sea', title: 'Bateau', icon: Ship, tagline: 'Quand le volume compte', featured: true, photo: '/images/freight/port.jpg' },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const body = (
          <Spotlight
            color={card.featured ? 'rgba(103,232,249,0.16)' : 'rgba(245,158,11,0.12)'}
            className={`h-full rounded-[1.4rem] p-6 sm:p-8 ${
              isDark ? 'bg-ink-950' : 'bg-white'
            } ${card.featured ? '' : isDark ? 'border border-white/10' : 'border border-slate-200'}`}
          >
            {/* Photo d'en-tête : zoom lent et léger glissement au survol de la carte */}
            <div className="relative -mx-6 -mt-6 mb-6 h-40 overflow-hidden rounded-t-[1.4rem] sm:-mx-8 sm:-mt-8 sm:h-48">
              <img
                src={card.photo}
                alt=""
                loading="lazy"
                className="h-full w-full scale-105 object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-[-3%] group-hover:scale-[1.16] [translate:calc(var(--tilt-x,0)*-12px)_calc(var(--tilt-y,0)*-8px)]"
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-ink-950' : 'from-white'} via-transparent to-transparent`}
              />
            </div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    card.featured ? 'bg-cyan-400/15 text-cyan-300' : 'bg-ember-400/15 text-ember-400'
                  }`}
                >
                  <Icon size={21} />
                </span>
                <div>
                  <p className={`font-editorial text-3xl leading-none ${isDark ? 'text-cream' : 'text-night-900'}`}>
                    {card.title}
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{card.tagline}</p>
                </div>
              </div>
              {card.featured && (
                <span className={`rounded-full px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.2em] ${isDark ? 'bg-cyan-400/15 text-cyan-300' : 'bg-cyan-100 text-cyan-800'}`}>
                  Nouveau
                </span>
              )}
            </div>

            <dl className="relative mt-7 space-y-1">
              {ROWS.map((row, r) => {
                const RowIcon = row.icon;
                return (
                  <motion.div
                    key={row.label}
                    initial={{ opacity: 0, x: card.featured ? 16 : -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.6, delay: 0.15 + r * 0.08, ease: EASE_OUT }}
                    className={`flex items-start gap-3 border-t py-3.5 ${isDark ? 'border-white/[0.07]' : 'border-slate-100'}`}
                  >
                    <dt className={`flex w-[8.75rem] shrink-0 items-start gap-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <RowIcon size={16} className={`mt-0.5 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                      {row.label}
                    </dt>
                    <dd className={`text-sm font-medium ${isDark ? 'text-slate-100' : 'text-night-900'}`}>
                      {card.key === 'air' ? row.air : row.sea}
                    </dd>
                  </motion.div>
                );
              })}
            </dl>
          </Spotlight>
        );

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, delay: i * 0.12, ease: EASE_OUT }}
            whileHover={{ y: -8 }}
            className="group"
          >
            <Tilt max={5} className="h-full rounded-[1.5rem]">
              {card.featured ? <div className="spin-border h-full rounded-[1.5rem] p-px">{body}</div> : body}
            </Tilt>
          </motion.div>
        );
      })}
    </div>
  );
}
