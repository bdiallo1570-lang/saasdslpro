import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScanArriveePage from '@/modules/colis/pages/ScanArriveePage';
import CaisseRegistrePage from './CaisseRegistrePage';
import { AppShell } from '@/layout/AppShell';

type Tab = 'scan' | 'caisse';

export default function CaisseHubPage() {
  const [tab, setTab] = useState<Tab>('scan');

  return (
    <AppShell>
      <div className="max-w-md mx-auto">
        <div className="flex bg-slate-100 dark:bg-night-700 rounded-lg p-1 mb-6 text-sm font-medium">
          <button
            onClick={() => setTab('scan')}
            className={`relative flex-1 py-2 rounded-md transition-colors ${
              tab === 'scan' ? 'text-night-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {tab === 'scan' && (
              <motion.span
                layoutId="caisse-hub-tab"
                className="absolute inset-0 bg-white dark:bg-night-600 rounded-md shadow"
              />
            )}
            <span className="relative">Scan arrivée</span>
          </button>
          <button
            onClick={() => setTab('caisse')}
            className={`relative flex-1 py-2 rounded-md transition-colors ${
              tab === 'caisse' ? 'text-night-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {tab === 'caisse' && (
              <motion.span
                layoutId="caisse-hub-tab"
                className="absolute inset-0 bg-white dark:bg-night-600 rounded-md shadow"
              />
            )}
            <span className="relative">Caisse du jour</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: tab === 'scan' ? -8 : 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: tab === 'scan' ? 8 : -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'scan' ? <ScanArriveePage /> : <CaisseRegistrePage />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
