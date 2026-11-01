import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// En-tête de page : le titre monte mot par mot hors d'un masque (même langage que la landing),
// puis la description et les actions arrivent en fondu.
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const words = title.split(' ');

  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <motion.h1
          aria-label={title}
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
          className="text-[28px] sm:text-3xl font-semibold tracking-tight text-night-900 dark:text-slate-50"
        >
          {words.map((word, i) => (
            <span key={i} aria-hidden="true" className="inline-block overflow-hidden align-bottom pb-1 -mb-1">
              <motion.span
                className="inline-block"
                variants={{
                  hidden: { y: '105%' },
                  show: { y: '0%', transition: { duration: 0.7, ease: EASE_OUT } },
                }}
              >
                {word}
                {i < words.length - 1 ? '\u00A0' : ''}
              </motion.span>
            </span>
          ))}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT }}
            className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl"
          >
            {description}
          </motion.p>
        )}
      </div>
      {actions && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: EASE_OUT }}
          className="flex items-center gap-2"
        >
          {actions}
        </motion.div>
      )}
    </div>
  );
}
