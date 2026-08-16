import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

interface FAQProps {
  isDark: boolean;
}

const FAQ_ITEMS = [
  {
    question: 'Combien ça coûte d\'envoyer un colis de Chine en Guinée ?',
    answer:
      'Ça dépend du type de marchandise et du poids réel. Pour du Cargo Standard (habits, chaussures, jouets, articles ménagers…), c\'est 160 000 GNF/kg. Pour du Cargo Sensible (batteries, liquides, électronique, cosmétiques…), c\'est 180 000 GNF/kg. Le plus simple : utilisez le calculateur plus haut sur cette page, vous avez le prix exact en quelques secondes.',
  },
  {
    question: 'Le colis met combien de temps pour arriver ?',
    answer:
      'Dès que votre colis est enregistré à notre entrepôt de Guangzhou et casé dans un vol, on vous donne une estimation d\'arrivée (ETA) à Conakry. Et dès qu\'il est disponible à l\'entrepôt de Madina, vous recevez un message WhatsApp automatique — pas besoin de nous relancer.',
  },
  {
    question: 'Comment vous calculez le poids pour la facturation ?',
    answer:
      'On facture au poids réel, celui pesé à la réception en Chine. Si vous nous donnez les dimensions, on calcule aussi un poids volumétrique à titre indicatif, mais c\'est toujours le poids réel qui compte pour le montant final.',
  },
  {
    question: 'Comment je suis mon colis ?',
    answer:
      'Chaque colis a un numéro de suivi unique dès son enregistrement (genre DSL-2026-00042). Entrez-le dans la barre de suivi en haut de la page et vous voyez tout en direct : enregistré, en vol, en douane, disponible à Conakry. En plus, on vous prévient par WhatsApp à chaque étape importante.',
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
      'Un entrepôt à Guangzhou (Chine) pour la réception et l\'enregistrement de vos colis, et un à Madina, Conakry, pour la réception, le dédouanement et la remise de vos marchandises. Les adresses complètes sont juste au-dessus, dans la section Entrepôts.',
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

  return (
    <section
      id="faq"
      className={`relative overflow-hidden py-20 sm:py-28 transition-colors duration-300 ${
        isDark ? 'bg-night-900' : 'bg-white'
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
                className={`rounded-2xl border overflow-hidden ${
                  isDark ? 'bg-night-800 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(expanded ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4"
                >
                  <span
                    className={`text-sm sm:text-base font-medium flex items-start gap-2.5 ${
                      isDark ? 'text-white' : 'text-night-900'
                    }`}
                  >
                    <HelpCircle
                      size={17}
                      className={`shrink-0 mt-0.5 ${isDark ? 'text-cargo-400' : 'text-cargo-500'}`}
                    />
                    {item.question}
                  </span>
                  <motion.div
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronDown size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p
                        className={`px-5 pb-4 pl-[2.9rem] text-sm leading-relaxed ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
