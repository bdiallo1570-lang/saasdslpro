import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { listColis, Colis } from '../colis.api';
import { COLIS_STATUS_LABELS } from '@/modules/landing/trackingLabels';
import { AppShell } from '@/layout/AppShell';
import { PageHeader, Card, Badge } from '@/ui';

const STATUS_TONE: Record<string, 'sky' | 'cargo' | 'green' | 'amber' | 'red' | 'slate'> = {
  ENREGISTRE: 'slate',
  ASSIGNE_LOT: 'sky',
  ENVOLE: 'sky',
  ARRIVE: 'cargo',
  EN_DEDOUANEMENT: 'amber',
  DISPONIBLE_ENTREPOT: 'cargo',
  LIVRE: 'green',
};

const listContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

// Vue Admin en lecture seule de la Réception — consultation uniquement, aucune création/action
// (l'enregistrement de colis reste réservé à l'agent Chine sur ReceptionPage).
export default function ReceptionConsultationPage() {
  const [colis, setColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setColis(await listColis());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AppShell>
      <PageHeader
        title="Réception — Consultation"
        description="Vue d'ensemble de tous les colis enregistrés (lecture seule)."
      />

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700">
          <h2 className="font-medium text-night-800 dark:text-slate-100">Colis ({colis.length})</h2>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Chargement…</p>
        ) : colis.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">
            Aucun colis enregistré pour le moment.
          </p>
        ) : (
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="divide-y divide-slate-100 dark:divide-night-700 max-h-[32rem] overflow-y-auto"
          >
            {colis.map((c) => (
              <motion.div
                key={c.id}
                variants={listItem}
                className="px-5 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-night-800 dark:text-slate-100 truncate">
                    {c.trackingId} · {c.client.fullName}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {c.description} · {c.poidsReelKg} kg
                  </p>
                </div>
                <Badge tone={STATUS_TONE[c.status] ?? 'slate'}>
                  {COLIS_STATUS_LABELS[c.status] ?? c.status}
                </Badge>
                <p className="font-semibold text-night-900 dark:text-slate-100 whitespace-nowrap">
                  {Number(c.montantEstime).toLocaleString('fr-FR')} {c.currency}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>
    </AppShell>
  );
}
