import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { listRecentAuditLogs, AuditLogEntry } from './audit.api';
import { Card } from '@/ui';

const listContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

// Phrase lisible par type d'action — fallback générique pour toute action non mappée, afin de
// ne jamais planter l'affichage sur un type d'action introduit ultérieurement.
function describeAction(entry: AuditLogEntry): string {
  const { action, metadata } = entry;
  switch (action) {
    case 'colis:cree':
      return `a créé le colis ${metadata.trackingId ?? ''}`.trim();
    case 'colis:statut_modifie':
      return `a mis à jour le statut du colis ${metadata.trackingId ?? ''}`.trim();
    case 'colis:ecart_poids_signale':
      return `a signalé un écart de poids${metadata.depasseSeuil ? ' (au-delà du seuil)' : ''}`;
    case 'colis:ecart_poids_resolu':
      return "a résolu un écart de poids";
    case 'facture:deblocage_livraison':
      return "a débloqué une livraison malgré facture impayée";
    default:
      return `a effectué une action : ${action}`;
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Fil d'actualité transversal — les 5 dernières actions sensibles, visibles par les 3 rôles
// agent pour qu'ils se coordonnent sans avoir à se téléphoner.
export function ActivityFeed() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await listRecentAuditLogs());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700">
        <h2 className="font-medium text-night-800 dark:text-slate-100">Fil d'actualité</h2>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Chargement…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">
          Aucune action récente pour le moment.
        </p>
      ) : (
        <motion.div
          variants={listContainer}
          initial="hidden"
          animate="show"
          className="divide-y divide-slate-100 dark:divide-night-700"
        >
          {entries.map((entry) => (
            <motion.div key={entry.id} variants={listItem} className="px-5 py-3 text-sm">
              <span className="font-medium text-night-800 dark:text-slate-100">
                {formatTime(entry.createdAt)}
              </span>{' '}
              <span className="text-slate-600 dark:text-slate-300">
                {entry.userRole ?? entry.userFullName ?? 'Quelqu\'un'} {describeAction(entry)}.
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </Card>
  );
}
