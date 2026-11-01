import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Spotlight } from '@/ui';
import { SectionHeading } from './SectionHeading';
import { MARITIME } from '../maritime/maritimeConfig';
import { usePublicPricing, withPrices } from '../publicPricing';

interface FAQProps {
  isDark: boolean;
}

const FAQ_ITEMS = [
  {
    question: 'Combien ça coûte d\'envoyer un colis de Chine en Guinée ?',
    answer:
      'Ça dépend du type de marchandise et du poids réel. {{tarifs}} Le plus simple : utilisez le calculateur plus haut sur cette page, vous avez le prix exact en quelques secondes.',
  },
  {
    question: 'Le colis met combien de temps pour arriver ?',
    answer:
      'Dès que votre colis est enregistré à notre entrepôt de Guangzhou et casé dans un vol, on vous donne une estimation d\'arrivée (ETA) à Conakry. Et dès qu\'il est disponible à l\'entrepôt de Madina, vous recevez un message WhatsApp automatique — pas besoin de nous relancer.',
  },
  {
    question: 'Vous faites aussi le transport par bateau ?',
    answer: `Oui, pour les gros volumes : meubles, machines, stock de boutique… Le fret maritime est facturé ${MARITIME.pricePerCbmUsd ? `${MARITIME.pricePerCbmUsd} USD le m³` : 'au mètre cube (CBM)'}, avec un délai d'environ ${MARITIME.transitLabel} de Guangzhou jusqu'à notre entrepôt de Madina. Contrairement à l'aérien (tout compris au kilo), le dédouanement est facturé à part, en francs guinéens. Le calculateur de volume, dans la section Maritime, vous donne le nombre de m³ et prépare votre demande de devis sur WhatsApp.`,
  },
  {
    question: 'Comment vous calculez le poids pour la facturation ?',
    answer:
      'On facture au poids réel, celui pesé à la réception en Chine. Si vous nous donnez les dimensions, on calcule aussi un poids volumétrique à titre indicatif, mais c\'est toujours le poids réel qui compte pour le montant final.',
  },
  {
    question: 'Comment je suis mon colis ?',
    answer:
      'Chaque colis a un numéro de suivi unique dès son enregistrement (genre DSL-2026-00042). On vous prévient par WhatsApp à chaque étape importante : enregistré, en vol, en douane, disponible à Conakry. Le suivi en ligne sur le site arrive bientôt.',
  },
  {
    question: 'Y a-t-il des restrictions sur ce que je peux envoyer ?',
    answer:
      'Oui, certains produits sont interdits (armes, drogues, matières dangereuses, contrefaçons…) et d\'autres passent sous conditions (batteries, liquides, médicaments). On a détaillé tout ça juste au-dessus, dans la section Produits interdits. Un doute sur un article ? Demandez-nous avant d\'envoyer.',
  },
  {
    question: 'Comment et où je peux payer ?',
    answer:
      'Au comptoir de Madina, à Conakry — en espèces, Orange Money ou virement. Vous pouvez payer en une fois ou en plusieurs fois, votre solde restant est toujours visible depuis votre espace client.',
  },
  {
    question: 'Et si le poids à l\'arrivée ne correspond pas à celui du départ ?',
    answer:
      'Notre équipe à Conakry peut signaler un écart à la réception. Mais c\'est toujours le poids saisi en Chine qui sert de référence pour la facturation — tout écart constaté est vérifié et communiqué avant le moindre ajustement, en toute transparence.',
  },
  {
    question: 'Vos entrepôts sont où exactement ?',
    answer:
      'À Guangzhou (Chine), deux entrepôts : l\'un pour le fret aérien, l\'autre pour le fret maritime (district de Baiyun), où vos colis sont réceptionnés et enregistrés. Et un à Madina, Conakry, pour la réception, le dédouanement et la remise de vos marchandises. Les adresses complètes sont juste au-dessus, dans la section Entrepôts.',
  },
  {
    question: 'Je peux envoyer un colis sans créer de compte ?',
    answer:
      'Non, chaque envoi est rattaché à une fiche client (nom, téléphone) pour qu\'on puisse suivre et facturer correctement. Mais pas de souci, c\'est gratuit et ça prend deux minutes — il suffit de donner vos infos au dépôt de votre premier colis.',
  },
  {
    question: 'Comment je vous contacte si j\'ai une question ?',
    answer:
      'Le plus rapide, c\'est WhatsApp — les numéros sont en bas de page. Vous pouvez aussi passer directement à nos entrepôts de Guangzhou ou Madina. Pour une question sur un colis précis, gardez votre numéro de suivi sous la main, ça va plus vite.',
  },
];

export function FAQ({ isDark }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const pricing = usePublicPricing();

  return (
    <section
      id="faq"
      className={`relative overflow-hidden py-20 sm:py-28 transition-colors duration-300 ${
        isDark ? 'bg-ink-950' : 'bg-white'
      }`}
    >
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading
          isDark={isDark}
          eyebrow="Questions fréquentes"
          title="Les questions qu'on nous pose le plus"
          className="mb-14"
        />

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const expanded = openIndex === i;
            return (
              <motion.div
                key={item.question}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }}
                className={`relative rounded-2xl border overflow-hidden transition-[border-color,box-shadow] duration-500 ${
                  expanded
                    ? isDark
                      ? 'border-ember-400/40 bg-ink-900 shadow-[0_0_40px_-12px_rgba(245,158,11,0.35)]'
                      : 'border-ember-400/60 bg-slate-50 shadow-[0_0_40px_-16px_rgba(245,158,11,0.5)]'
                    : isDark
                      ? 'bg-ink-900 border-white/10 hover:border-white/20'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Barre dorée de la question ouverte : elle glisse d'une question à l'autre */}
                {expanded && (
                  <motion.span
                    layoutId="faq-active-bar"
                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-ember-400 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                  />
                )}
                <Spotlight color="rgba(245,158,11,0.10)" size={420} className="rounded-2xl">
                  <button
                    onClick={() => setOpenIndex(expanded ? null : i)}
                    aria-expanded={expanded}
                    className="group relative w-full flex items-center justify-between gap-4 text-left px-5 py-4"
                  >
                    <span
                      className={`text-sm sm:text-base font-medium flex items-baseline gap-4 transition-transform duration-300 group-hover:translate-x-1.5 ${
                        isDark ? 'text-white' : 'text-night-900'
                      }`}
                    >
                      {/* Numéro éditorial : il s'allume au survol et quand la question est ouverte */}
                      <span
                        className={`font-label text-[11px] tabular-nums tracking-[0.2em] transition-colors duration-300 ${
                          expanded ? (isDark ? 'text-ember-400' : 'text-amber-700') : isDark ? 'text-slate-400 group-hover:text-ember-400' : 'text-slate-500 group-hover:text-amber-700'
                        }`}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {item.question}
                    </span>
                    {/* « + » qui pivote en « × » ; le disque se remplit à l'ouverture */}
                    <motion.span
                      animate={{ rotate: expanded ? 135 : 0 }}
                      whileHover={{ scale: 1.12 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                        expanded
                          ? 'border-ember-400 bg-ember-400 text-ink-950'
                          : isDark
                            ? 'border-white/15 text-slate-400 group-hover:border-ember-400/60 group-hover:text-ember-400'
                            : 'border-slate-300 text-slate-500 group-hover:border-ember-400 group-hover:text-ember-500'
                      }`}
                    >
                      <Plus size={16} />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 32, opacity: { duration: 0.25 } }}
                        className="overflow-hidden"
                      >
                        <motion.p
                          initial={{ y: -8, filter: 'blur(6px)' }}
                          animate={{ y: 0, filter: 'blur(0px)' }}
                          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                          className={`relative px-5 pb-5 pl-[3.4rem] text-sm leading-relaxed ${
                            isDark ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          {withPrices(item.answer, pricing)}
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Spotlight>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
