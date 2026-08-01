import { ReactNode } from 'react';
import { Card } from './Card';
import { StatCounter } from './StatCounter';
import { SkeletonCard } from './Skeleton';

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

  return (
    <Card interactive glow={tone === 'cargo' ? 'cargo' : 'sky'} className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {icon && <div className={`${TONE_TEXT[tone]} opacity-80`}>{icon}</div>}
      </div>
      <p className={`mt-2 text-2xl font-bold ${TONE_TEXT[tone]}`}>
        <StatCounter value={value} formatter={formatter} />
        {suffix && <span className="text-base font-medium ml-1 opacity-70">{suffix}</span>}
      </p>
    </Card>
  );
}
