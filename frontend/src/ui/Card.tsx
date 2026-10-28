import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode, forwardRef } from 'react';

interface CardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  interactive?: boolean;
  glow?: 'sky' | 'cargo' | 'none';
  className?: string;
}

// Carte de base : fond adaptatif clair/sombre, bordure subtile, ombre portée.
// interactive=true ajoute l'effet de survol (élévation + bordure lumineuse).
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, interactive = false, glow = 'sky', className = '', ...props }, ref) => {
    const glowClass =
      glow === 'sky'
        ? 'hover:shadow-glow-sky hover:border-sky-400/50'
        : glow === 'cargo'
          ? 'hover:shadow-glow-cargo hover:border-cargo-500/50'
          : '';

    return (
      <motion.div
        ref={ref}
        className={`rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-night-600 dark:bg-night-800 dark:shadow-card-dark transition-[transform,box-shadow,border-color] duration-300 ease-out ${
          interactive ? `cursor-pointer ${glowClass} hover:-translate-y-1` : ''
        } ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
Card.displayName = 'Card';
