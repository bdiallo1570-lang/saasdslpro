import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface TabItem {
  key: string;
  label: string;
  badge?: number;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

// Navigation à onglets — onglet actif souligné en orange cargo, indicateur qui glisse d'un onglet
// à l'autre et halo de survol qui suit la souris. Identifiants uniques par instance : deux barres
// d'onglets ouvertes en même temps (page + modale) ne se volent plus l'indicateur.
export function Tabs({ tabs, active, onChange }: TabsProps) {
  const id = useId();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      role="tablist"
      className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-night-700 mb-6"
      onMouseLeave={() => setHovered(null)}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            onMouseEnter={() => setHovered(tab.key)}
            className={`relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'text-cargo-600 dark:text-cargo-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {hovered === tab.key && (
              <motion.span
                layoutId={`${id}-hover`}
                className="absolute inset-x-0 inset-y-1 rounded-lg bg-slate-100 dark:bg-night-700/70"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {tab.label}
              <AnimatePresence initial={false}>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                    className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-semibold"
                  >
                    {tab.badge}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            {isActive && (
              <motion.div
                layoutId={`${id}-active`}
                className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-cargo-500 shadow-[0_0_12px_rgba(245,158,11,0.7)]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
