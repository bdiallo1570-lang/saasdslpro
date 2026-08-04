import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, PackageCheck, Boxes, Wallet, AlertTriangle, Landmark } from 'lucide-react';
import { getDashboardOverview, DashboardOverview } from '../dashboard.api';
import { listColis, updateColisStatus, Colis } from '@/modules/colis/colis.api';
import { COLIS_STATUS_LABELS } from '@/modules/landing/trackingLabels';
import { extractErrorMessage } from '@/lib/apiClient';
import { ActivityFeed } from '@/modules/audit/ActivityFeed';
import { AppShell } from '@/layout/AppShell';
import { PageHeader, Card, StatCard, Button, Badge, Modal, Select, notify } from '@/ui';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function formatGnf(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} GNF`;
}

type PillKey = 'ATTENTE' | 'VOL' | 'DOUANE' | 'LIVRE';

// Mapping des 7 statuts techniques colis vers les 4 pills demandées : En attente = avant envol,
// En vol = envolé, En douane = arrivé + dédouanement, Livré = disponible entrepôt + livré.
const PILL_STATUSES: Record<PillKey, string[]> = {
  ATTENTE: ['ENREGISTRE', 'ASSIGNE_LOT'],
  VOL: ['ENVOLE'],
  DOUANE: ['ARRIVE', 'EN_DEDOUANEMENT'],
  LIVRE: ['DISPONIBLE_ENTREPOT', 'LIVRE'],
};

const PILL_LABELS: Record<PillKey, string> = {
  ATTENTE: '🔵 En attente',
  VOL: '🟡 En vol',
  DOUANE: '🟠 En douane',
  LIVRE: '🟢 Livré',
};

// Statuts vers lesquels un colis peut être manuellement avancé — LIVRE exclu (verrou entrepôt
// lié au paiement, règle 3.4 GEMINI.md), géré exclusivement par le flux de scan/livraison.
const UPDATABLE_STATUSES = [
  'ENREGISTRE',
  'ASSIGNE_LOT',
  'ENVOLE',
  'ARRIVE',
  'EN_DEDOUANEMENT',
  'DISPONIBLE_ENTREPOT',
];

// Vue d'ensemble transversale — pièce centrale du Dashboard Financier Admin, agrège en un
// coup d'œil l'activité de tous les modules (colis, lots, caisse, créances) au lieu de forcer
// une navigation manuelle module par module pour se faire une idée de la santé de l'entreprise.
export default function DashboardFinancierPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedPill, setSelectedPill] = useState<PillKey | null>(null);
  const [pillColis, setPillColis] = useState<Colis[]>([]);
  const [loadingPillColis, setLoadingPillColis] = useState(false);

  const [statusModalColis, setStatusModalColis] = useState<Colis | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDashboardOverview();
      setOverview(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loadPillColis = useCallback(async (pill: PillKey) => {
    setLoadingPillColis(true);
    try {
      setPillColis(await listColis({ status: PILL_STATUSES[pill] }));
    } finally {
      setLoadingPillColis(false);
    }
  }, []);

  function handlePillClick(pill: PillKey) {
    if (selectedPill === pill) {
      setSelectedPill(null);
      setPillColis([]);
      return;
    }
    setSelectedPill(pill);
    loadPillColis(pill);
  }

  function openStatusModal(colis: Colis) {
    setStatusModalColis(colis);
    setNewStatus(colis.status);
  }

  async function handleUpdateStatus() {
    if (!statusModalColis || !newStatus) return;
    setUpdatingStatus(true);
    try {
      await updateColisStatus(statusModalColis.trackingId, newStatus);
      notify.success('Statut mis à jour.');
      setStatusModalColis(null);
      if (selectedPill) await loadPillColis(selectedPill);
      await refresh();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setUpdatingStatus(false);
    }
  }

  const colisParStatut = overview?.colisParStatut ?? {};
  const pillCounts: Record<PillKey, number> = {
    ATTENTE: PILL_STATUSES.ATTENTE.reduce((s, st) => s + (colisParStatut[st] ?? 0), 0),
    VOL: PILL_STATUSES.VOL.reduce((s, st) => s + (colisParStatut[st] ?? 0), 0),
    DOUANE: PILL_STATUSES.DOUANE.reduce((s, st) => s + (colisParStatut[st] ?? 0), 0),
    LIVRE: PILL_STATUSES.LIVRE.reduce((s, st) => s + (colisParStatut[st] ?? 0), 0),
  };

  return (
    <AppShell>
      <PageHeader
        title="Dashboard Financier"
        description="Vue d'ensemble en temps réel de l'activité — colis, lots, caisse et créances de toute l'entreprise."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <motion.div variants={item}>
              <StatCard
                label="CA encaissé"
                value={overview?.caEncaisse ?? 0}
                formatter={formatGnf}
                tone="green"
                icon={<Wallet size={18} />}
                loading={loading}
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard
                label="Impayés"
                value={overview?.totalImpayes ?? 0}
                formatter={formatGnf}
                tone="red"
                icon={<AlertTriangle size={18} />}
                loading={loading}
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard
                label="Colis en transit"
                value={overview?.colisEnTransit ?? 0}
                tone="sky"
                icon={<Package size={18} />}
                loading={loading}
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard
                label="Lots actifs"
                value={overview?.lotsActifs ?? 0}
                tone="cargo"
                icon={<Boxes size={18} />}
                loading={loading}
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard
                label="Livrés aujourd'hui"
                value={overview?.colisLivresAujourdhui ?? 0}
                tone="green"
                icon={<PackageCheck size={18} />}
                loading={loading}
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard
                label="Factures impayées"
                value={overview?.nombreFacturesImpayees ?? 0}
                tone="red"
                icon={<AlertTriangle size={18} />}
                loading={loading}
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard
                label="Caisse du jour (GNF)"
                value={overview?.caisseDuJourGnf ?? 0}
                formatter={formatGnf}
                tone="neutral"
                icon={<Landmark size={18} />}
                loading={loading}
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard
                label="Caisses ouvertes"
                value={overview?.nombreCaissesOuvertes ?? 0}
                tone="sky"
                icon={<Landmark size={18} />}
                loading={loading}
              />
            </motion.div>
          </motion.div>

          {/* Filtres de statut — cliquer une pill affiche la liste des colis concernés en dessous */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
          >
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PILL_LABELS) as PillKey[]).map((pill) => (
                <button
                  key={pill}
                  onClick={() => handlePillClick(pill)}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full border transition-colors ${
                    selectedPill === pill
                      ? 'bg-night-800 text-white border-night-800 dark:bg-sky-500 dark:border-sky-500'
                      : 'bg-white text-night-700 border-slate-200 hover:border-slate-300 dark:bg-night-800 dark:text-slate-200 dark:border-night-600'
                  }`}
                >
                  {PILL_LABELS[pill]} ({pillCounts[pill]})
                </button>
              ))}
            </div>

            {selectedPill && (
              <Card className="mt-3 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700">
                  <h2 className="font-medium text-night-800 dark:text-slate-100">
                    {PILL_LABELS[selectedPill]} — {pillColis.length} colis
                  </h2>
                </div>
                {loadingPillColis ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Chargement…</p>
                ) : pillColis.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">
                    Aucun colis dans cette catégorie.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-night-700 max-h-96 overflow-y-auto">
                    {pillColis.map((c) => (
                      <div key={c.id} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-night-800 dark:text-slate-100 truncate">
                            {c.trackingId} · {c.client.fullName}
                          </p>
                          <Badge tone="slate" className="mt-1">
                            {COLIS_STATUS_LABELS[c.status] ?? c.status}
                          </Badge>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => openStatusModal(c)}>
                          Mettre à jour le statut
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.3 }}
            className="flex flex-wrap gap-3"
          >
            <Link to="/creances">
              <Button variant="cargo">Suivi des créances &amp; impayés</Button>
            </Link>
            <Link to="/lots">
              <Button variant="secondary">Voir les lots</Button>
            </Link>
            <Link to="/caisse/consultation">
              <Button variant="secondary">Voir la caisse</Button>
            </Link>
            <Link to="/reception/consultation">
              <Button variant="secondary">Voir la réception</Button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.2 }}
          className="lg:col-span-1"
        >
          <ActivityFeed />
        </motion.div>
      </div>

      <Modal
        open={!!statusModalColis}
        onClose={() => setStatusModalColis(null)}
        title={`Mettre à jour ${statusModalColis?.trackingId ?? ''}`}
        maxWidthClassName="max-w-sm"
      >
        <div className="space-y-4">
          <Select label="Nouveau statut" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            {UPDATABLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {COLIS_STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </Select>
          <Button variant="cargo" fullWidth loading={updatingStatus} onClick={handleUpdateStatus}>
            Confirmer
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
