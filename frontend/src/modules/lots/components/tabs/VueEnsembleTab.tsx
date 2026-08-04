import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, PackageCheck, Receipt, TrendingUp } from 'lucide-react';
import { Lot, LotStatus, LOT_STATUS_LABELS, setLotFlightInfo, updateLotStatus, assignColisToLot } from '../../lots.api';
import { RentabiliteLot } from '../../rentabilite.api';
import { Colis } from '@/modules/colis/colis.api';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, Badge, Input, StatCard, notify } from '@/ui';

const STATUS_ORDER: LotStatus[] = [
  'EN_RECEPTION',
  'FERME',
  'ENVOLE',
  'ARRIVE',
  'EN_DEDOUANEMENT',
  'EN_ENTREPOT',
  'CLOTURE',
];

function formatGnf(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} GNF`;
}

interface VueEnsembleTabProps {
  lot: Lot;
  rentabilite: RentabiliteLot | null;
  rentabiliteLoading: boolean;
  unassignedColis: Colis[];
  onRefresh: () => Promise<void>;
}

// Onglet "Vue d'ensemble" — informations de vol, progression statut, manifeste, assignation
// (sections déjà existantes) + barre de 4 KPI (CA facturé, Encaissé, Dépenses, Marge brute).
export function VueEnsembleTab({ lot, rentabilite, rentabiliteLoading, unassignedColis, onRefresh }: VueEnsembleTabProps) {
  const { user } = useAuth();
  const [selectedColisIds, setSelectedColisIds] = useState<string[]>([]);
  const [flightNumber, setFlightNumber] = useState(lot.flightNumber ?? '');
  const [departureDate, setDepartureDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentIndex = STATUS_ORDER.indexOf(lot.status);
  const nextStatus = STATUS_ORDER[currentIndex + 1];
  const margeBrute = rentabilite?.resultats.margeBruteGnf ?? 0;

  async function handleAssign() {
    if (selectedColisIds.length === 0) return;
    setSaving(true);
    try {
      await assignColisToLot(lot.id, selectedColisIds);
      setSelectedColisIds([]);
      await onRefresh();
      notify.success('Colis assignés au lot avec succès.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetFlightInfo() {
    if (!flightNumber || !departureDate) return;
    setSaving(true);
    setError(null);
    try {
      await setLotFlightInfo(lot.id, flightNumber, new Date(departureDate).toISOString());
      await onRefresh();
      notify.success('Informations de vol enregistrées.');
    } catch {
      setError("Impossible d'enregistrer les informations de vol.");
      notify.error("Impossible d'enregistrer les informations de vol.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdvanceStatus(next: LotStatus) {
    setSaving(true);
    try {
      await updateLotStatus(lot.id, next);
      await onRefresh();
      notify.success(`Statut du lot mis à jour : « ${LOT_STATUS_LABELS[next]} ».`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {(user?.role === 'Admin' || user?.role === 'Agent Guinée') && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            label="CA facturé"
            value={rentabilite?.revenus.caFactureGnf ?? 0}
            formatter={formatGnf}
            tone="sky"
            icon={<Receipt size={18} />}
            loading={rentabiliteLoading}
          />
          <StatCard
            label="Encaissé"
            value={rentabilite?.revenus.encaissementsGnf ?? 0}
            formatter={formatGnf}
            tone="green"
            icon={<Wallet size={18} />}
            loading={rentabiliteLoading}
          />
          <StatCard
            label="Dépenses"
            value={rentabilite?.depenses.totalGnf ?? 0}
            formatter={formatGnf}
            tone="cargo"
            icon={<PackageCheck size={18} />}
            loading={rentabiliteLoading}
          />
          <StatCard
            label="Marge brute"
            value={margeBrute}
            formatter={formatGnf}
            tone={margeBrute >= 0 ? 'green' : 'red'}
            icon={<TrendingUp size={18} />}
            loading={rentabiliteLoading}
          />
        </motion.div>
      )}

      <Card className="p-5">
        <h2 className="font-medium text-night-800 dark:text-slate-100 mb-3">Informations de vol</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Numéro de vol"
            type="text"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
          />
          <Input
            label="Date d'embarquement"
            type="datetime-local"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
          />
          <div className="flex items-end">
            <Button
              variant="primary"
              loading={saving}
              disabled={saving || !flightNumber || !departureDate}
              onClick={handleSetFlightInfo}
              fullWidth
            >
              Enregistrer
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        {lot.estimatedArrival && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
            ETA Conakry estimée :{' '}
            <span className="font-medium text-night-700 dark:text-slate-200">
              {new Date(lot.estimatedArrival).toLocaleString('fr-FR')}
            </span>
          </p>
        )}
        {user?.role === 'Admin' && lot.tauxVersGnfFige && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Taux figé de ce lot :{' '}
            <span className="font-medium text-night-700 dark:text-slate-200">
              1 {lot.tauxDeviseOrigine} = {Number(lot.tauxVersGnfFige).toLocaleString('fr-FR')} GNF
            </span>
          </p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-medium text-night-800 dark:text-slate-100 mb-3">Statut du lot</h2>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((s, idx) => (
            <motion.div key={s} layout transition={{ duration: 0.25 }}>
              <Badge tone={idx <= currentIndex ? 'sky' : 'slate'}>{LOT_STATUS_LABELS[s]}</Badge>
            </motion.div>
          ))}
        </div>
        {nextStatus && (
          <Button
            variant="cargo"
            loading={saving}
            disabled={saving}
            onClick={() => handleAdvanceStatus(nextStatus)}
            className="mt-4"
          >
            Passer à « {LOT_STATUS_LABELS[nextStatus]} »
          </Button>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-medium text-night-800 dark:text-slate-100 mb-3">
          Colis du manifeste ({lot.colis?.length ?? 0})
        </h2>
        {lot.colis && lot.colis.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-night-700">
            {lot.colis.map((c) => (
              <div key={c.id} className="py-2 flex justify-between text-sm">
                <span className="text-night-800 dark:text-slate-200">
                  {c.trackingId} — {c.client.fullName}
                </span>
                <span className="text-slate-400 dark:text-slate-500">{c.poidsReelKg} kg</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500">Aucun colis assigné à ce lot.</p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-medium text-night-800 dark:text-slate-100 mb-3">Assigner des colis en attente</h2>
        {unassignedColis.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Aucun colis en attente d'assignation.</p>
        ) : (
          <>
            <div className="divide-y divide-slate-100 dark:divide-night-700 max-h-64 overflow-y-auto mb-3">
              {unassignedColis.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 py-2 px-1 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-night-700/50 rounded-md"
                >
                  <input
                    type="checkbox"
                    checked={selectedColisIds.includes(c.id)}
                    onChange={(e) =>
                      setSelectedColisIds((prev) =>
                        e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id),
                      )
                    }
                    className="rounded border-slate-300 text-sky-500 focus:ring-sky-400 dark:border-night-600 dark:bg-night-700"
                  />
                  <span className="text-night-800 dark:text-slate-200">
                    {c.trackingId} — {c.client.fullName} ({c.poidsReelKg} kg)
                  </span>
                </label>
              ))}
            </div>
            <Button
              variant="primary"
              loading={saving}
              disabled={saving || selectedColisIds.length === 0}
              onClick={handleAssign}
            >
              Assigner au lot ({selectedColisIds.length})
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
