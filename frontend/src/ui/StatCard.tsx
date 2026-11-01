import { ReactNode } from 'react';
import { Card } from './Card';
import { StatCounter } from './StatCounter';
import { SkeletonCard } from './Skeleton';
import { Spotlight } from './Spotlight';

interface StatCardProps {
  label: string;
  value: number;
  formatter?: (value: number) => string;
  suffix?: string;
  icon?: ReactNode;
  tone?: 'sky' | 'cargo' | 'green' | 'red' | 'neutral';
  loading?: boolean;
}

const TONE_TEXT: Record<NonNullable<StatCardProps['tone']>, string> = {
  sky: 'text-sky-500 dark:text-sky-400',
  cargo: 'text-cargo-500 dark:text-cargo-400',
  green: 'text-emerald-600 dark:text-emerald-400',
  red: 'text-red-600 dark:text-red-400',
  neutral: 'text-night-900 dark:text-slate-100',
};

// Pastille d'icône et filet lumineux en haut de carte, dans la couleur de la statistique
const TONE_ACCENT: Record<NonNullable<StatCardProps['tone']>, { chip: string; line: string; spot: string }> = {
  sky: { chip: 'bg-sky-500/10 ring-sky-500/20', line: 'via-sky-400/70', spot: 'rgba(16,185,129,0.12)' },
  cargo: { chip: 'bg-cargo-500/10 ring-cargo-500/20', line: 'via-cargo-400/70', spot: 'rgba(245,158,11,0.12)' },
  green: { chip: 'bg-emerald-500/10 ring-emerald-500/20', line: 'via-emerald-400/70', spot: 'rgba(16,185,129,0.12)' },
  red: { chip: 'bg-red-500/10 ring-red-500/20', line: 'via-red-400/70', spot: 'rgba(239,68,68,0.11)' },
  neutral: { chip: 'bg-slate-500/10 ring-slate-500/20', line: 'via-slate-400/50', spot: 'rgba(148,163,184,0.12)' },
};

export function StatCard({
  label,
  value,
  formatter,
  suffix,
  icon,
  tone = 'neutral',
  loading = false,
}: StatCardProps) {
  if (loading) return <SkeletonCard />;
  const accent = TONE_ACCENT[tone];

  return (
    <Card interactive glow={tone === 'cargo' ? 'cargo' : 'sky'} className="group relative h-full overflow-hidden">
      <span
        aria-hidden="true"
        className={`absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent ${accent.line} to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-100`}
      />
      <Spotlight color={accent.spot} className="h-full p-5">
        <div className="relative flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          {icon && (
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 ${accent.chip} ${TONE_TEXT[tone]}`}
            >
              {icon}
            </div>
          )}
        </div>
        <p className={`relative mt-3 text-2xl font-bold tabular-nums tracking-tight ${TONE_TEXT[tone]}`}>
          <StatCounter value={value} formatter={formatter} duration={1.4} />
          {suffix && <span className="text-base font-medium ml-1 opacity-70">{suffix}</span>}
        </p>
      </Spotlight>
    </Card>
  );
}
