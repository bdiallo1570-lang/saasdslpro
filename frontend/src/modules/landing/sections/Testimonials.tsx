import { motion } from 'framer-motion';
import { Star, BadgeCheck } from 'lucide-react';
import { StatCounter, Tilt } from '@/ui';
import { AuroraBackground } from './AuroraBackground';
import { SectionHeading } from './SectionHeading';

interface TestimonialsProps {
  isDark: boolean;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const TESTIMONIALS = [
  {
    quote:
      'Mes colis de vêtements arrivent à Conakry sans aucun retard. Le suivi WhatsApp est un vrai plus !',
    name: 'Aissatou B.',
    role: 'Commerçante à Conakry',
  },
  {
    quote:
      "En tant qu'importateur d'électronique, la gestion des impayés et la clarté des tarifs au kilo m'ont convaincu.",
    name: 'Mamadou S.',
    role: 'Importateur électronique',
  },
  {
    quote:
      "Le calculateur de prix en ligne m'évite les mauvaises surprises. Je sais exactement combien je vais payer avant d'envoyer.",
    name: 'Fatoumata C.',
    role: 'Grossiste textile',
  },
];

const METRICS = [
  { value: 50, suffix: '+', label: 'Tonnes expédiées' },
  { value: 99, suffix: '%', label: 'Livraisons à temps' },
  { value: 1500, suffix: '+', label: 'Clients satisfaits' },
];

export function Testimonials({ isDark }: TestimonialsProps) {
  return (
    <section
      id="avis"
      className={`relative overflow-hidden py-20 sm:py-28 transition-colors duration-300 ${
        isDark ? 'bg-ink-950' : 'bg-white'
      }`}
    >
      <AuroraBackground isDark={isDark} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          isDark={isDark}
          eyebrow="Ils nous font confiance"
          title="Des centaines de commerçants livrés chaque mois"
          className="mb-14"
        />

        {/* Métriques : chaque chiffre se soulève et s'illumine au survol */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-16 max-w-2xl mx-auto"
        >
          {METRICS.map((m) => (
            <motion.div key={m.label} whileHover="hover" className="group cursor-default text-center">
              <motion.p
                variants={{ hover: { y: -6, scale: 1.06 } }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className={`text-3xl sm:text-4xl font-extrabold transition-[color,text-shadow] duration-300 group-hover:text-ember-400 group-hover:[text-shadow:0_0_30px_rgba(245,158,11,0.45)] ${
                  isDark ? 'text-white' : 'text-night-900'
                }`}
              >
                <StatCounter value={m.value} duration={1.2} />
                {m.suffix}
              </motion.p>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Cartes d'avis : elles arrivent empilées puis s'étalent comme un jeu de cartes ; au survol
            elles s'inclinent vers le pointeur, les étoiles s'allument une à une. */}
        <motion.div
          initial="stacked"
          whileInView="spread"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              variants={{
                stacked: { opacity: 0, x: (1 - i) * 120, y: 60, rotate: (i - 1) * 8, scale: 0.9 },
                spread: {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  rotate: 0,
                  scale: 1,
                  transition: { duration: 1.1, delay: 0.1 + i * 0.08, ease: EASE_OUT },
                },
              }}
            >
              <Tilt max={9} className="h-full rounded-2xl">
                <div
                  className={`group relative h-full overflow-hidden rounded-2xl border p-6 flex flex-col transition-colors duration-300 ${
                    isDark
                      ? 'bg-ink-900 border-white/10 hover:border-ember-400/40'
                      : 'bg-slate-50 border-slate-200 hover:border-ember-400/60'
                  }`}
                >
                  {/* Guillemet géant, en profondeur : il glisse en sens inverse de l'inclinaison */}
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute right-5 top-1 font-editorial text-[7rem] leading-[0.8] transition-colors duration-500 [translate:calc(var(--tilt-x,0)*-14px)_calc(var(--tilt-y,0)*-14px)] ${
                      isDark ? 'text-white/[0.04] group-hover:text-ember-400/15' : 'text-slate-900/[0.05] group-hover:text-ember-400/25'
                    }`}
                  >
                    “
                  </span>

                  <div className="relative flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        size={15}
                        style={{ transitionDelay: `${idx * 60}ms` }}
                        className="fill-cargo-400 text-cargo-400 transition-[transform,filter] duration-300 group-hover:scale-125 group-hover:-rotate-12 group-hover:[filter:drop-shadow(0_0_6px_rgba(245,158,11,0.9))]"
                      />
                    ))}
                  </div>
                  <p className={`relative text-sm flex-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>« {t.quote} »</p>
                  <div className="relative flex items-center gap-2 mt-5">
                    {/* Avatar : anneau dégradé qui tourne au survol */}
                    <div className="relative h-9 w-9">
                      <span className="absolute -inset-[2px] rounded-full bg-[conic-gradient(from_0deg,#FFB35C,#38bdf8,#FFB35C)] opacity-0 transition-opacity duration-300 group-hover:animate-[spin_3s_linear_infinite] group-hover:opacity-100" />
                      <div
                        className={`relative h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                          isDark ? 'bg-ink-900 text-sky-400' : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {t.name.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <p className={`text-sm font-semibold flex items-center gap-1 ${isDark ? 'text-white' : 'text-night-900'}`}>
                        {t.name}
                        <BadgeCheck size={14} className="text-sky-500" />
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </Tilt>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
