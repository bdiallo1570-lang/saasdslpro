import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScanArriveePage from '@/modules/colis/pages/ScanArriveePage';
import CaisseRegistrePage from './CaisseRegistrePage';
import { LotsAReglerTab } from '../components/LotsAReglerTab';
import { AppShell } from '@/layout/AppShell';

type Tab = 'scan' | 'caisse' | 'a-regler';

const TABS: { key: Tab; label: string }[] = [
  { key: 'scan', label: 'Scan arrivée' },
  { key: 'caisse', label: 'Caisse du jour' },
  { key: 'a-regler', label: 'Lots à régler' },
];

export default function CaisseHubPage() {
  const [tab, setTab] = useState<Tab>('scan');

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <div className="flex bg-slate-100 dark:bg-night-700 rounded-lg p-1 mb-6 text-sm font-medium">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex-1 py-2 rounded-md transition-colors ${
                tab === t.key ? 'text-night-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {tab === t.key && (
                <motion.span
                  layoutId="caisse-hub-tab"
                  className="absolute inset-0 bg-white dark:bg-night-600 rounded-md shadow"
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'scan' && <ScanArriveePage />}
            {tab === 'caisse' && <CaisseRegistrePage />}
            {tab === 'a-regler' && <LotsAReglerTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
