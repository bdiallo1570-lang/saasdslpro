import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ban, ShieldCheck, PackageCheck, AlertTriangle, ChevronDown } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

interface ForbiddenItemsProps {
  isDark: boolean;
}

type Onglet = 'interdits' | 'conditions' | 'emballage';

const STRICTEMENT_INTERDITS = [
  {
    title: 'Matières dangereuses',
    items: ['Explosifs et munitions', 'Produits inflammables (essence, gaz)', 'Substances corrosives', 'Matières radioactives'],
  },
  {
    title: 'Armes & drogues',
    items: ['Armes à feu et armes blanches', 'Stupéfiants et drogues', 'Substances psychotropes', 'Précurseurs chimiques'],
  },
  {
    title: 'Contrefaçons',
    items: ['Produits contrefaits', 'Copies de marques', 'Faux documents', 'Logiciels piratés'],
  },
  {
    title: 'Autres cas interdits',
    items: ['Batteries au lithium seules (transport aérien)', 'Liquides non identifiés', 'Animaux vivants', 'Denrées périssables non autorisées'],
  },
];

const SOUS_CONDITIONS = [
  {
    title: 'Batteries & électronique',
    detail:
      "Une batterie toute seule ne passe pas en avion. Par contre, si elle est déjà intégrée dans l'appareil (téléphone, ordinateur, etc.), pas de souci. Les power banks restent limités.",
  },
  {
    title: 'Liquides, crèmes & poudres',
    detail:
      "Il faut que ce soit bien identifié et fermé hermétiquement. Les cosmétiques en quantité raisonnable passent sans problème — les liquides inflammables, eux, restent interdits.",
  },
  {
    title: 'Médicaments & compléments',
    detail:
      "Les médicaments réglementés (avec notice, autorisation claire) passent, à déclarer. Ceux qui ne sont pas réglementés — sans cadre clair, origine douteuse — ne sont pas acceptés.",
  },
];

const CONSEILS_EMBALLAGE = [
  {
    title: 'Objets fragiles',
    tips: ['Doublez l\'emballage avec du papier bulle', 'Calez bien l\'intérieur pour éviter les chocs', 'Marquez "FRAGILE" sur le carton', 'Ne laissez pas d\'espace vide dans le colis'],
  },
  {
    title: 'Liquides autorisés',
    tips: ['Contenant hermétique et étanche', 'Emballez dans un sac plastique en plus', 'Calez pour éviter toute fuite', 'Étiquette "LIQUIDE" bien visible'],
  },
  {
    title: 'Appareils électroniques',
    tips: ["Gardez l'emballage d'origine si possible", 'Batterie toujours intégrée à l\'appareil', 'Ajoutez une protection anti-choc', 'Jamais de batterie seule en avion'],
  },
  {
    title: 'Bonnes pratiques générales',
    tips: ['Cartons solides, double cannelure', 'Maximum 30 kg par carton', 'Étiquette d\'expédition sur deux faces', 'Scotch renforcé sur toutes les ouvertures'],
  },
];

const TABS: { key: Onglet; label: string; icon: typeof Ban; tone: 'red' | 'amber' | 'emerald' }[] = [
  { key: 'interdits', label: 'Interdits', icon: Ban, tone: 'red' },
  { key: 'conditions', label: 'Sous conditions', icon: AlertTriangle, tone: 'amber' },
  { key: 'emballage', label: 'Bien emballer', icon: PackageCheck, tone: 'emerald' },
];

const TONE_CLASSES = {
  red: {
    activeLight: 'bg-red-600 text-white',
    activeDark: 'bg-red-500 text-white',
    cardLight: 'bg-red-50 border-red-100',
    cardDark: 'bg-red-500/5 border-red-500/20',
    textLight: 'text-red-700',
    textDark: 'text-red-300',
    markLight: 'text-red-500',
    markDark: 'text-red-400',
  },
  amber: {
    activeLight: 'bg-amber-500 text-white',
    activeDark: 'bg-amber-500 text-white',
    cardLight: 'bg-amber-50 border-amber-100',
    cardDark: 'bg-amber-500/5 border-amber-500/20',
    textLight: 'text-amber-700',
    textDark: 'text-amber-300',
    markLight: 'text-amber-500',
    markDark: 'text-amber-400',
  },
  emerald: {
    activeLight: 'bg-emerald-600 text-white',
    activeDark: 'bg-emerald-500 text-white',
    cardLight: 'bg-white border-slate-200',
    cardDark: 'bg-ink-950 border-white/10',
    textLight: 'text-emerald-600',
    textDark: 'text-emerald-400',
    markLight: 'text-emerald-500',
    markDark: 'text-emerald-500',
  },
} as const;

// Accordéon générique — une seule entrée dépliée à la fois par onglet, réutilisé pour les trois
// listes (interdits/conditions/emballage) qui partagent la même mécanique d'expand/collapse.
function AccordeonListe({
  isDark,
  tone,
  entries,
}: {
  isDark: boolean;
  tone: 'red' | 'amber' | 'emerald';
  entries: { title: string; body: React.ReactNode }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const c = TONE_CLASSES[tone];

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const expanded = openIndex === i;
        return (
          <div
            key={entry.title}
            className={`rounded-2xl border overflow-hidden ${isDark ? c.cardDark : c.cardLight}`}
          >
            <button
              onClick={() => setOpenIndex(expanded ? null : i)}
              className="w-full flex items-center justify-between gap-4 text-left px-5 py-4"
            >
              <span className={`text-sm font-semibold ${isDark ? c.textDark : c.textLight}`}>
                {entry.title}
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
                  <div className="px-5 pb-4">{entry.body}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function ForbiddenItems({ isDark }: ForbiddenItemsProps) {
  const [tab, setTab] = useState<Onglet>('interdits');

  return (
    <section
      id="produits-interdits"
      className={`relative overflow-hidden py-20 sm:py-28 transition-colors duration-300 ${
        isDark ? 'bg-ink-900' : 'bg-slate-50'
      }`}
    >
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading
          isDark={isDark}
          eyebrow="À savoir avant d'envoyer"
          title="Produits interdits et conseils d'emballage"
          description="Un petit récap pour éviter les mauvaises surprises et faire voyager vos colis dans les meilleures conditions."
          className="mb-10"
        />

        {/* Onglets */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
          className={`flex rounded-xl p-1 mb-6 text-sm font-medium ${isDark ? 'bg-ink-950' : 'bg-white border border-slate-200'}`}
        >
          {TABS.map((t) => {
            const active = tab === t.key;
            const c = TONE_CLASSES[t.tone];
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-colors ${
                  active
                    ? isDark
                      ? c.activeDark
                      : c.activeLight
                    : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-500 hover:text-night-900'
                }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Contenu de l'onglet actif */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'interdits' && (
              <AccordeonListe
                isDark={isDark}
                tone="red"
                entries={STRICTEMENT_INTERDITS.map((cat) => ({
                  title: cat.title,
                  body: (
                    <ul className="space-y-1.5">
                      {cat.items.map((item) => (
                        <li
                          key={item}
                          className={`text-xs flex items-start gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
                        >
                          <span className="text-red-400 mt-0.5">×</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ),
                }))}
              />
            )}

            {tab === 'conditions' && (
              <AccordeonListe
                isDark={isDark}
                tone="amber"
                entries={SOUS_CONDITIONS.map((cat) => ({
                  title: cat.title,
                  body: (
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {cat.detail}
                    </p>
                  ),
                }))}
              />
            )}

            {tab === 'emballage' && (
              <AccordeonListe
                isDark={isDark}
                tone="emerald"
                entries={CONSEILS_EMBALLAGE.map((cat) => ({
                  title: cat.title,
                  body: (
                    <ul className="space-y-1.5">
                      {cat.tips.map((tip) => (
                        <li
                          key={tip}
                          className={`text-xs flex items-start gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
                        >
                          <ShieldCheck size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  ),
                }))}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className={`text-center text-xs mt-10 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
        >
          Un doute sur un article précis ? Contactez notre équipe avant l'envoi, on vous répond
          rapidement.
        </motion.p>
      </div>
    </section>
  );
}
