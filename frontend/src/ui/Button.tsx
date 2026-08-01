import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode, forwardRef } from 'react';

type Variant = 'primary' | 'cargo' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-sky-500 text-white hover:bg-sky-400 focus-visible:ring-sky-400 disabled:bg-sky-500/50',
  cargo:
    'bg-cargo-500 text-white hover:bg-cargo-400 focus-visible:ring-cargo-400 disabled:bg-cargo-500/50 shadow-glow-cargo',
  secondary:
    'bg-slate-100 text-night-800 hover:bg-slate-200 dark:bg-night-700 dark:text-slate-100 dark:hover:bg-night-600 focus-visible:ring-slate-400',
  ghost:
    'bg-transparent text-night-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-night-700 focus-visible:ring-slate-400',
  danger:
    'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-400 disabled:bg-red-600/50',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-6 py-3 gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { children, variant = 'primary', size = 'md', loading, fullWidth, className = '', disabled, ...props },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center rounded-lg font-medium
          transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          dark:focus-visible:ring-offset-night-900 disabled:cursor-not-allowed
          ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </motion.button>
    );
  },
);
Button.displayName = 'Button';
