import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { listAlertes, Alerte } from '@/modules/alertes/alertes.api';
import { AlerteRow } from '@/modules/alertes/AlerteRow';
import { Card } from '@/ui';

const listContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

interface AlertesTabProps {
  lotId: string;
}

// Onglet "Alertes" du lot — liste des alertes actives spécifiques à ce lot.
export function AlertesTab({ lotId }: AlertesTabProps) {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setAlertes(await listAlertes({ lotId }));
    } finally {
      setLoading(false);
    }
  }, [lotId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700">
        <h2 className="font-medium text-night-800 dark:text-slate-100">Alertes du lot ({alertes.length})</h2>
      </div>
      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Chargement…</p>
      ) : alertes.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Aucune alerte active sur ce lot.</p>
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
  );
}
