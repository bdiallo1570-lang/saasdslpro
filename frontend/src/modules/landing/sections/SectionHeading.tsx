import { motion } from 'framer-motion';

interface SectionHeadingProps {
  isDark: boolean;
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}

// En-tête de section partagé (eyebrow + titre + description optionnelle) utilisé par toutes les
// sections de la landing. Le trait d'accent sous le titre se dessine au scroll — un même geste
// répété sur chaque section, mais discret et rapide (bornes transform/scale, jamais de fondu
// supplémentaire empilé sur l'existant).
export function SectionHeading({ isDark, eyebrow, title, description, className }: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className={`text-center ${className ?? ''}`}
    >
      <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
        {eyebrow}
      </p>
      <h2 className={`inline-block text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-night-900'}`}>
        {title}
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ originX: 0 }}
          className={`block h-[3px] mt-2 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-cargo-400`}
        />
      </h2>
      {description && (
        <p className={`mt-4 max-w-xl mx-auto text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {description}
        </p>
      )}
    </motion.div>
  );
}
