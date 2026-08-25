import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { listColis, Colis, dateReceptionEffective, StatutPaiementColis } from '../colis.api';
import { ColisActionsModal } from '../components/ColisActionsModal';
import { COLIS_STATUS_LABELS } from '@/modules/landing/trackingLabels';
import { STATUT_PAIEMENT_LABELS } from '@/modules/lots/paiementsLot.api';
import { AppShell } from '@/layout/AppShell';
import { PageHeader, Card, Badge, Input } from '@/ui';

const STATUS_TONE: Record<string, 'sky' | 'cargo' | 'green' | 'amber' | 'red' | 'slate'> = {
  ENREGISTRE: 'slate',
  ASSIGNE_LOT: 'sky',
  ENVOLE: 'sky',
  ARRIVE: 'cargo',
  EN_DEDOUANEMENT: 'amber',
  DISPONIBLE_ENTREPOT: 'cargo',
  LIVRE: 'green',
};

const STATUT_PAIEMENT_TONE: Record<StatutPaiementColis, 'red' | 'amber' | 'green' | 'sky'> = {
  IMPAYE: 'red',
  PARTIEL: 'amber',
  SOLDE: 'green',
  TROP_PERCU: 'sky',
};

const listContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

// Liste de tous les colis pour l'Agent Guinée — équivalent de "Colis enregistrés" côté
// Chine/Admin, avec un clic sur une ligne qui ouvre directement le panneau d'actions
// (paiement, reçu, message client, statut) au lieu de naviguer entre plusieurs écrans.
export default function ColisGuineePage() {
  const [colis, setColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);

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

  const fuse = useMemo(
    () =>
      new Fuse(colis, {
        keys: ['trackingId', 'client.fullName', 'client.phoneGn', 'client.phoneWhatsapp'],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [colis],
  );

  const filteredColis = useMemo(() => {
    const base = query.trim() ? fuse.search(query.trim()).map((r) => r.item) : colis;
    return [...base].sort(
      (a, b) => new Date(dateReceptionEffective(b)).getTime() - new Date(dateReceptionEffective(a)).getTime(),
    );
  }, [query, fuse, colis]);

  return (
    <AppShell>
      <PageHeader
        title="Colis"
        description="Cliquez sur un colis pour encaisser un paiement, télécharger le reçu, relancer le client ou faire avancer le statut."
      />

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700 space-y-3">
          <h2 className="font-medium text-night-800 dark:text-slate-100">
            Colis ({filteredColis.length})
          </h2>
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par N° de suivi, Nom client, ou Téléphone..."
          />
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Chargement…</p>
        ) : filteredColis.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">
            {query.trim() ? 'Aucun colis ne correspond à cette recherche.' : 'Aucun colis enregistré pour le moment.'}
          </p>
        ) : (
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="divide-y divide-slate-100 dark:divide-night-700 max-h-[32rem] overflow-y-auto"
          >
            {filteredColis.map((c) => (
              <motion.button
                key={c.id}
                variants={listItem}
                onClick={() => setSelectedColis(c)}
                className="w-full px-5 py-3 flex items-center justify-between gap-4 text-left hover:bg-slate-50 dark:hover:bg-night-700/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-night-800 dark:text-slate-100 truncate">
                    {c.trackingId} · {c.client.fullName}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {c.description} · {c.poidsReelKg} kg · Reçu le{' '}
                    {new Date(dateReceptionEffective(c)).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[c.status] ?? 'slate'}>{COLIS_STATUS_LABELS[c.status] ?? c.status}</Badge>
                {c.statutPaiement && (
                  <Badge tone={STATUT_PAIEMENT_TONE[c.statutPaiement]}>{STATUT_PAIEMENT_LABELS[c.statutPaiement]}</Badge>
                )}
                {c.montantEstime !== undefined && (
                  <p className="font-semibold text-night-900 dark:text-slate-100 whitespace-nowrap">
                    {Number(c.montantEstime).toLocaleString('fr-FR')} {c.currency}
                  </p>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </Card>

      <ColisActionsModal
        colis={selectedColis}
        onClose={() => setSelectedColis(null)}
        onUpdated={() => refresh()}
      />
    </AppShell>
  );
}
