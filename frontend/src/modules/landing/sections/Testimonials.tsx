import { motion } from 'framer-motion';
import { Star, BadgeCheck } from 'lucide-react';
import { StatCounter } from '@/ui';

interface TestimonialsProps {
  isDark: boolean;
}

const TESTIMONIALS = [
  {
    quote:
      'Mes colis de vêtements arrivent à Madina sans aucun retard. Le suivi WhatsApp est un vrai plus !',
    name: 'Aissatou B.',
    role: 'Commerçante à Madina',
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
      className={`relative overflow-hidden py-20 sm:py-28 transition-colors duration-300 ${
        isDark ? 'bg-night-900' : 'bg-white'
      }`}
    >
      {/* Skyline de Shanghai en toile de fond, très estompée — anime légèrement au scroll */}
      <motion.div
        initial={{ opacity: 0, scale: 1.08 }}
        whileInView={{ opacity: isDark ? 0.14 : 0.08, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
        className="pointer-events-none absolute inset-0 bg-cover bg-center grayscale"
        style={{ backgroundImage: "url('/images/backgrounds/shanghai-skyline.jpg')" }}
      />
      <div
        className={`pointer-events-none absolute inset-0 ${
          isDark
            ? 'bg-gradient-to-b from-night-900 via-night-900/70 to-night-900'
            : 'bg-gradient-to-b from-white via-white/80 to-white'
        }`}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            Ils nous font confiance
          </p>
          <h2 className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-night-900'}`}>
            Des centaines de commerçants livrés chaque mois
          </h2>
        </motion.div>

        {/* Métriques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-16 max-w-2xl mx-auto"
        >
          {METRICS.map((m) => (
            <div key={m.label} className="text-center">
              <p className={`text-3xl sm:text-4xl font-extrabold ${isDark ? 'text-white' : 'text-night-900'}`}>
                <StatCounter value={m.value} duration={1.2} />
                {m.suffix}
              </p>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {m.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Cartes d'avis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className={`rounded-2xl border p-6 flex flex-col ${
                isDark ? 'bg-night-800 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} size={15} className="fill-cargo-400 text-cargo-400" />
                ))}
              </div>
              <p className={`text-sm flex-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                « {t.quote} »
              </p>
              <div className="flex items-center gap-2 mt-5">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isDark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className={`text-sm font-semibold flex items-center gap-1 ${isDark ? 'text-white' : 'text-night-900'}`}>
                    {t.name}
                    <BadgeCheck size={14} className="text-sky-500" />
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
