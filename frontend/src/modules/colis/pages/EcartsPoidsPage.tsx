import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  listUnresolvedWeightDiscrepancies,
  resolveWeightDiscrepancy,
  WeightDiscrepancy,
} from '../colis.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { AppShell } from '@/layout/AppShell';
import { PageHeader, Card, Badge, Button, Input, notify } from '@/ui';

const listContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const listItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// Alertes d'écart de poids Chine → Guinée dépassant le seuil configurable — visible Admin
// uniquement. Le poids Chine (Colis.poidsReelKg) reste la source de facturation ; ces écarts
// sont purement informatifs/traçabilité, jamais utilisés pour recalculer un montant.
export default function EcartsPoidsPage() {
  const [discrepancies, setDiscrepancies] = useState<WeightDiscrepancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setDiscrepancies(await listUnresolvedWeightDiscrepancies());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleResolve(id: string) {
    setResolvingId(id);
    try {
      await resolveWeightDiscrepancy(id, notes[id]);
      notify.success('Écart résolu.');
      await refresh();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Écarts de poids Chine → Guinée"
        description="Alertes d'écart dépassant le seuil configuré, avec traçabilité des deux agents concernés."
      />

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700">
          <h2 className="font-medium text-night-800 dark:text-slate-100">
            Écarts non résolus ({discrepancies.length})
          </h2>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Chargement…</p>
        ) : discrepancies.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">
            Aucun écart de poids dépassant le seuil pour le moment.
          </p>
        ) : (
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="divide-y divide-slate-100 dark:divide-night-700"
          >
            {discrepancies.map((d) => (
              <motion.div key={d.id} variants={listItem} className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-night-800 dark:text-slate-100 truncate">
                      {d.colis?.trackingId ?? d.colisId} {d.colis?.client ? `· ${d.colis.client.fullName}` : ''}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Chine : {d.poidsChineKg} kg · Guinée : {d.poidsGuineeKg} kg ·{' '}
                      {new Date(d.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <Badge tone="red">Écart {Number(d.ecartPourcent).toFixed(1)}%</Badge>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Note de résolution (optionnel)"
                    value={notes[d.id] ?? ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={resolvingId === d.id}
                    onClick={() => handleResolve(d.id)}
                  >
                    Résoudre
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>
    </AppShell>
  );
}
