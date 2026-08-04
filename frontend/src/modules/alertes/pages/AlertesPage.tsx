import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { listAlertes, Alerte, NiveauAlerte } from '../alertes.api';
import { AlerteRow } from '../AlerteRow';
import { AppShell } from '@/layout/AppShell';
import { PageHeader, Card, Select } from '@/ui';

const listContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

// Page globale — toutes les alertes tous lots confondus, filtrables par niveau, triées par
// ancienneté (les plus anciennes en premier — déjà l'ordre retourné par le backend).
export default function AlertesPage() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreNiveau, setFiltreNiveau] = useState<NiveauAlerte | ''>('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setAlertes(await listAlertes(filtreNiveau ? { niveau: filtreNiveau } : undefined));
    } finally {
      setLoading(false);
    }
  }, [filtreNiveau]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AppShell>
      <PageHeader
        title="Alertes"
        description="Toutes les alertes actives, tous lots confondus — impayés, marges faibles, dépenses manquantes."
      />

      <div className="flex justify-end mb-4">
        <Select value={filtreNiveau} onChange={(e) => setFiltreNiveau(e.target.value as NiveauAlerte | '')}>
          <option value="">Tous niveaux</option>
          <option value="CRITIQUE">Critique</option>
          <option value="ATTENTION">Attention</option>
          <option value="INFO">Info</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700">
          <h2 className="font-medium text-night-800 dark:text-slate-100">Alertes ({alertes.length})</h2>
        </div>
        {loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Chargement…</p>
        ) : alertes.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Aucune alerte active pour le moment.</p>
        ) : (
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="divide-y divide-slate-100 dark:divide-night-700"
          >
            {alertes.map((a, i) => (
              <motion.div key={`${a.code}-${i}`} variants={listItem}>
                <AlerteRow alerte={a} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>
    </AppShell>
  );
}
