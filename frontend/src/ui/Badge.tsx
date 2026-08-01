import { ReactNode } from 'react';

type BadgeTone = 'sky' | 'cargo' | 'green' | 'amber' | 'red' | 'slate';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  sky: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30',
  cargo:
    'bg-cargo-50 text-cargo-700 border-cargo-200 dark:bg-cargo-500/10 dark:text-cargo-300 dark:border-cargo-500/30',
  green:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
  amber:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
  red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',
  slate:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-night-700 dark:text-slate-300 dark:border-night-600',
};

export function Badge({ children, tone = 'slate', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
