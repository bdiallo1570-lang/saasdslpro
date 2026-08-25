import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import {
  getPaiementsParLot,
  LotPaiementsGroupe,
  STATUT_PAIEMENT_LABELS,
  StatutPaiementColis,
} from '@/modules/lots/paiementsLot.api';
import { getColisByTrackingId, Colis } from '@/modules/colis/colis.api';
import { ColisActionsModal } from '@/modules/colis/components/ColisActionsModal';
import { extractErrorMessage } from '@/lib/apiClient';
import { Card, Badge, notify } from '@/ui';

const STATUT_TONE: Record<StatutPaiementColis, 'red' | 'amber' | 'green' | 'sky'> = {
  IMPAYE: 'red',
  PARTIEL: 'amber',
  SOLDE: 'green',
  TROP_PERCU: 'sky',
};

// Vue globale "ce qu'on a à régler" pour l'Agent Guinée : tous les colis facturés, groupés par
// lot, avec dû/payé/reste — pour éviter de naviguer lot par lot depuis la page Lots. Les lots
// entièrement soldés (tous colis à reste 0) sont marqués en vert et relégués en fin de liste
// par le backend (getPaiementsParLot), les lots restant à régler remontent en premier.
export function LotsAReglerTab() {
  const [groupes, setGroupes] = useState<LotPaiementsGroupe[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLotId, setExpandedLotId] = useState<string | null>(null);
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);
  const [loadingColisId, setLoadingColisId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setGroupes(await getPaiementsParLot());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Cette vue n'a que le résumé du colis (dû/payé/reste) — on récupère l'objet complet au clic
  // pour alimenter le panneau d'actions centralisé (paiement, reçu, message, statut).
  async function handleOuvrirColis(colisId: string, trackingId: string) {
    setLoadingColisId(colisId);
    try {
      setSelectedColis(await getColisByTrackingId(trackingId));
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setLoadingColisId(null);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700">
        <h2 className="font-medium text-night-800 dark:text-slate-100">
          Lots à régler ({groupes.length})
        </h2>
      </div>
      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Chargement…</p>
      ) : groupes.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">
          Aucun colis facturé pour le moment.
        </p>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-night-700">
          {groupes.map((g) => {
            const expanded = expandedLotId === g.lot.id;
            return (
              <div key={g.lot.id} className={g.solde ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : undefined}>
                <button
                  onClick={() => setExpandedLotId(expanded ? null : g.lot.id)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50 dark:hover:bg-night-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={16} className="text-slate-400 shrink-0" />
                    </motion.div>
                    <div className="min-w-0">
                      <p className="font-medium text-night-800 dark:text-slate-100 truncate">
                        {g.lot.lotNumber}
                        {g.lot.flightNumber ? ` · Vol ${g.lot.flightNumber}` : ''} — {g.colis.length} colis
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                        Dû : {Math.round(g.dûGnf).toLocaleString('fr-FR')} · Payé :{' '}
                        {Math.round(g.payéGnf).toLocaleString('fr-FR')} · Reste :{' '}
                        {Math.round(g.resteGnf).toLocaleString('fr-FR')} GNF
                      </p>
                    </div>
                  </div>
                  {g.solde ? (
                    <Badge tone="green">Lot traité</Badge>
                  ) : (
                    <Badge tone="red">
                      Reste {Math.round(g.resteGnf).toLocaleString('fr-FR')} GNF
                    </Badge>
                  )}
                </button>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-slate-50 dark:bg-night-900/40"
                    >
                      {g.colis.map((c) => (
                        <button
                          key={c.colisId}
                          onClick={() => handleOuvrirColis(c.colisId, c.trackingId)}
                          disabled={loadingColisId === c.colisId}
                          className="w-full px-5 py-2.5 border-t border-slate-100 dark:border-night-700 flex items-center justify-between gap-3 text-sm text-left hover:bg-slate-100 dark:hover:bg-night-800/60 transition-colors disabled:opacity-60"
                        >
                          <span className="text-night-700 dark:text-slate-200 truncate">
                            {c.trackingId} — {c.client.fullName}
                          </span>
                          <span className="tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {Math.round(c.dûGnf).toLocaleString('fr-FR')} /{' '}
                            {Math.round(c.payéGnf).toLocaleString('fr-FR')} /{' '}
                            {Math.round(c.resteGnf).toLocaleString('fr-FR')}
                          </span>
                          <Badge tone={STATUT_TONE[c.statutPaiement]}>
                            {STATUT_PAIEMENT_LABELS[c.statutPaiement]}
                          </Badge>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      <ColisActionsModal
        colis={selectedColis}
        onClose={() => setSelectedColis(null)}
        onUpdated={() => refresh()}
      />
    </Card>
  );
}
