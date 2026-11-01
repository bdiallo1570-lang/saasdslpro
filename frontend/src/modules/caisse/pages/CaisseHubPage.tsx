import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScanArriveePage from '@/modules/colis/pages/ScanArriveePage';
import CaisseRegistrePage from './CaisseRegistrePage';
import { LotsAReglerTab } from '../components/LotsAReglerTab';
import { VueEnsembleCaisseTab } from '../components/VueEnsembleCaisseTab';
import { AppShell } from '@/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { ROLE_NAMES } from '@/lib/roles';

type Tab = 'vue-ensemble' | 'scan' | 'caisse' | 'a-regler';

// Onglets visibles par rôle, alignés sur les permissions du backend : le caissier n'a ni les
// créances ni les coûts de lot (finance:read_margins, lots:read_costs), ni l'entrepôt (scan).
// Sans ce filtre, ses onglets appelaient des routes interdites (erreurs 403 à l'ouverture).
const TABS: { key: Tab; label: string; roles: string[] }[] = [
  { key: 'vue-ensemble', label: "Vue d'ensemble", roles: [ROLE_NAMES.AGENT_GUINEE] },
  { key: 'scan', label: 'Scan arrivée', roles: [ROLE_NAMES.AGENT_GUINEE] },
  { key: 'caisse', label: 'Caisse du jour', roles: [ROLE_NAMES.AGENT_GUINEE, ROLE_NAMES.CAISSIER] },
  { key: 'a-regler', label: 'Lots à régler', roles: [ROLE_NAMES.AGENT_GUINEE] },
];

export default function CaisseHubPage() {
  const { user } = useAuth();
  const tabs = TABS.filter((t) => user && t.roles.includes(user.role));
  const [tab, setTab] = useState<Tab>(tabs[0]?.key ?? 'caisse');

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        {/* Un seul onglet (caissier) : pas de barre d'onglets */}
        {tabs.length > 1 && (
        <div className="flex bg-slate-100 dark:bg-night-700 rounded-lg p-1 mb-6 text-sm font-medium">
          {tabs.map((t) => (
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
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'vue-ensemble' && <VueEnsembleCaisseTab />}
            {tab === 'scan' && <ScanArriveePage />}
            {tab === 'caisse' && <CaisseRegistrePage />}
            {tab === 'a-regler' && <LotsAReglerTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
