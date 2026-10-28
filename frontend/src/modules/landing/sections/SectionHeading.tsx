import { motion } from 'framer-motion';

interface SectionHeadingProps {
  isDark: boolean;
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}

const VIEWPORT = { once: true, margin: '-80px' } as const;

// En-tête de section partagé : surtitre encadré de deux filets, titre qui se révèle mot par mot
// (chaque mot glisse hors d'un masque — transform + opacity seulement, donc fluide), puis
// description. Rejoué une seule fois, à l'entrée dans l'écran.
export function SectionHeading({ isDark, eyebrow, title, description, className }: SectionHeadingProps) {
  const words = title.split(' ');

  return (
    <div className={`text-center ${className ?? ''}`}>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT}
        transition={{ duration: 0.5 }}
        className={`inline-flex items-center gap-3 font-label text-[11px] uppercase tracking-[0.3em] ${
          isDark ? 'text-ember-400' : 'text-emerald-700'
        }`}
      >
        <span className="h-px w-8 bg-current opacity-40" />
        {eyebrow}
        <span className="h-px w-8 bg-current opacity-40" />
      </motion.p>

      {/* L'animation est déclenchée par le titre entier (whileInView) et propagée aux mots : un mot
          caché hors de son masque n'est jamais « visible » pour le navigateur, il ne pourrait pas
          déclencher sa propre apparition. */}
      <motion.h2
        aria-label={title}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        variants={{ show: { transition: { staggerChildren: 0.045, delayChildren: 0.08 } } }}
        className={`mt-5 text-balance font-editorial text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.02] ${
          isDark ? 'text-cream' : 'text-night-900'
        }`}
      >
        {words.map((word, i) => (
          <span key={i} aria-hidden="true" className="inline-block overflow-hidden align-bottom pb-1 -mb-1">
            <motion.span
              variants={{
                hidden: { y: '110%', opacity: 0 },
                show: { y: '0%', opacity: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="inline-block"
            >
              {word}
              {i < words.length - 1 ? ' ' : ''}
            </motion.span>
          </span>
        ))}
      </motion.h2>

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={`mt-5 max-w-xl mx-auto text-base leading-relaxed ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
