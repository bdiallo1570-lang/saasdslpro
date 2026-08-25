import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingDown, AlertTriangle, PackageSearch } from 'lucide-react';
import { getOpenClosure, CashRegisterClosure } from '../caisse.api';
import { getCreancesKpis, CreancesKpis } from '@/modules/creances/creances.api';
import { getPaiementsParLot, LotPaiementsGroupe } from '@/modules/lots/paiementsLot.api';
import { Card, StatCard } from '@/ui';

const CURRENCY = 'GNF';

// Vue d'accueil de l'onglet "Caisse Madina" — donne à l'Agent Guinée les chiffres clés de la
// comptabilité côté Guinée en un coup d'œil, sans avoir à naviguer entre les onglets détaillés
// (caisse du jour, créances, lots à régler). Agrège trois sources déjà existantes plutôt que
// de dupliquer leur logique de calcul.
export function VueEnsembleCaisseTab() {
  const [closure, setClosure] = useState<CashRegisterClosure | null>(null);
  const [creances, setCreances] = useState<CreancesKpis | null>(null);
  const [lots, setLots] = useState<LotPaiementsGroupe[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [c, k, l] = await Promise.all([
        getOpenClosure(CURRENCY),
        getCreancesKpis(),
        getPaiementsParLot(),
      ]);
      setClosure(c);
      setCreances(k);
      setLots(l);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const entrees = closure?.transactions.filter((t) => t.type === 'ENTREE') ?? [];
  const depenses = closure?.transactions.filter((t) => t.type === 'DEPENSE') ?? [];
  const totalEntrees = entrees.reduce((s, t) => s + Number(t.montant), 0);
  const totalDepenses = depenses.reduce((s, t) => s + Number(t.montant), 0);
  const soldeTheorique = closure ? Number(closure.fondOuverture) + totalEntrees - totalDepenses : 0;

  const lotsAFinir = lots.filter((l) => !l.solde);
  const resteAPercevoirLots = lotsAFinir.reduce((s, l) => s + l.resteGnf, 0);

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h2 className="font-medium text-night-800 dark:text-slate-100 mb-3">Caisse du jour</h2>
        {!closure ? (
          <Card className="p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Aucune caisse ouverte aujourd'hui pour {CURRENCY} — ouvrez-la depuis l'onglet « Caisse du jour ».
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Fond d'ouverture" value={Number(closure.fondOuverture)} tone="sky" suffix="GNF" loading={loading} />
            <StatCard label="Entrées du jour" value={totalEntrees} tone="green" suffix="GNF" loading={loading} icon={<Wallet size={16} />} />
            <StatCard label="Dépenses du jour" value={totalDepenses} tone="red" suffix="GNF" loading={loading} icon={<TrendingDown size={16} />} />
            <StatCard label="Solde théorique" value={soldeTheorique} tone="cargo" suffix="GNF" loading={loading} />
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <h2 className="font-medium text-night-800 dark:text-slate-100 mb-3">Créances & impayés</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Total créances"
            value={creances?.totalCreances ?? 0}
            tone="red"
            suffix="GNF"
            loading={loading}
            icon={<AlertTriangle size={16} />}
          />
          <StatCard label="Clients à risque" value={creances?.clientsARisque ?? 0} tone="red" loading={loading} />
          <StatCard label="Paiements partiels" value={creances?.paiementsPartiels ?? 0} tone="cargo" loading={loading} />
          <StatCard label="Factures impayées" value={creances?.nombreFacturesImpayees ?? 0} tone="neutral" loading={loading} />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <h2 className="font-medium text-night-800 dark:text-slate-100 mb-3">Lots à régler</h2>
        <Card className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-cargo-500/10 text-cargo-500 dark:text-cargo-400 flex items-center justify-center shrink-0">
              <PackageSearch size={18} />
            </div>
            <div>
              <p className="font-medium text-night-800 dark:text-slate-100">
                {lotsAFinir.length} lot{lotsAFinir.length !== 1 ? 's' : ''} restant{lotsAFinir.length !== 1 ? 's' : ''} à régler
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Voir l'onglet « Lots à régler » pour le détail par colis
              </p>
            </div>
          </div>
          <p className="text-lg font-semibold text-cargo-600 dark:text-cargo-400 tabular-nums whitespace-nowrap">
            {Math.round(resteAPercevoirLots).toLocaleString('fr-FR')} GNF
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
