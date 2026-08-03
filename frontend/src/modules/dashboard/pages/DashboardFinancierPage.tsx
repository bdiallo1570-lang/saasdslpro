import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, PackageCheck, Boxes, Wallet, AlertTriangle, Landmark } from 'lucide-react';
import { getDashboardOverview, DashboardOverview } from '../dashboard.api';
import { COLIS_STATUS_LABELS } from '@/modules/landing/trackingLabels';
import { AppShell } from '@/layout/AppShell';
import { PageHeader, Card, StatCard, Button } from '@/ui';

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

function formatRelativeDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Vue d'ensemble transversale — pièce centrale du Dashboard Financier Admin, agrège en un
// coup d'œil l'activité de tous les modules (colis, lots, caisse, créances) au lieu de forcer
// une navigation manuelle module par module pour se faire une idée de la santé de l'entreprise.
export default function DashboardFinancierPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

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

  const { dernierColis, dernierLot } = overview?.derniereActivite ?? { dernierColis: null, dernierLot: null };

  return (
    <AppShell>
      <PageHeader
        title="Dashboard Financier"
        description="Vue d'ensemble en temps réel de l'activité — colis, lots, caisse et créances de toute l'entreprise."
      />

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

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.2 }}
        className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <Card className="p-5">
          <h2 className="font-medium text-night-800 dark:text-slate-100 mb-3">Dernier colis enregistré</h2>
          {loading ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Chargement…</p>
          ) : dernierColis ? (
            <div className="text-sm">
              <p className="font-semibold text-night-900 dark:text-slate-100">{dernierColis.trackingId}</p>
              <p className="text-slate-500 dark:text-slate-400">{dernierColis.clientNom}</p>
              <p className="text-slate-400 dark:text-slate-500 mt-1">
                {COLIS_STATUS_LABELS[dernierColis.status] ?? dernierColis.status} ·{' '}
                {formatRelativeDate(dernierColis.createdAt)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">Aucun colis enregistré pour le moment.</p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-medium text-night-800 dark:text-slate-100 mb-3">Dernier lot mis à jour</h2>
          {loading ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Chargement…</p>
          ) : dernierLot ? (
            <div className="text-sm">
              <p className="font-semibold text-night-900 dark:text-slate-100">{dernierLot.lotNumber}</p>
              <p className="text-slate-400 dark:text-slate-500 mt-1">
                {dernierLot.status} · {formatRelativeDate(dernierLot.updatedAt)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">Aucun lot pour le moment.</p>
          )}
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.3 }}
        className="mt-8 flex flex-wrap gap-3"
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
    </AppShell>
  );
}
