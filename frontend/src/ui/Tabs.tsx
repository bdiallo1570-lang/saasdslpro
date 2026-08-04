import { motion } from 'framer-motion';

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

// Navigation à onglets — onglet actif souligné en orange cargo, indicateur animé.
export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-night-700 mb-6">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'text-cargo-600 dark:text-cargo-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-semibold">
                  {tab.badge}
                </span>
              )}
            </span>
            {isActive && (
              <motion.div
                layoutId="tabs-active-indicator"
                className="absolute left-0 right-0 -bottom-px h-0.5 bg-cargo-500"
                transition={{ duration: 0.2 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
