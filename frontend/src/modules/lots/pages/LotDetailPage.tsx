import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient, ApiResponse } from '@/lib/apiClient';
import {
  getLot,
  setLotFlightInfo,
  updateLotStatus,
  assignColisToLot,
  Lot,
  LotStatus,
  LOT_STATUS_LABELS,
} from '../lots.api';
import { Colis } from '@/modules/colis/colis.api';
import { AppShell } from '@/layout/AppShell';
import { Card, Button, Badge, Input, PageHeader, notify } from '@/ui';

const STATUS_ORDER: LotStatus[] = [
  'EN_RECEPTION',
  'FERME',
  'ENVOLE',
  'ARRIVE',
  'EN_DEDOUANEMENT',
  'EN_ENTREPOT',
  'CLOTURE',
];

const STATUS_TONE: Record<LotStatus, 'sky' | 'cargo' | 'amber' | 'green' | 'slate'> = {
  EN_RECEPTION: 'slate',
  FERME: 'slate',
  ENVOLE: 'sky',
  ARRIVE: 'sky',
  EN_DEDOUANEMENT: 'amber',
  EN_ENTREPOT: 'cargo',
  CLOTURE: 'green',
};

export default function LotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lot, setLot] = useState<Lot | null>(null);
  const [unassignedColis, setUnassignedColis] = useState<Colis[]>([]);
  const [selectedColisIds, setSelectedColisIds] = useState<string[]>([]);
  const [flightNumber, setFlightNumber] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    const lotData = await getLot(id);
    setLot(lotData);
    setFlightNumber(lotData.flightNumber ?? '');

    const res = await apiClient.get<ApiResponse<Colis[]>>('/colis', {
      params: { status: 'ENREGISTRE' },
    });
    setUnassignedColis(res.data.data ?? []);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!lot) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24 text-slate-400 dark:text-slate-500">
          Chargement…
        </div>
      </AppShell>
    );
  }

  async function handleAssign() {
    if (!id || selectedColisIds.length === 0) return;
    setSaving(true);
    try {
      await assignColisToLot(id, selectedColisIds);
      setSelectedColisIds([]);
      await refresh();
      notify.success('Colis assignés au lot avec succès.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetFlightInfo() {
    if (!id || !flightNumber || !departureDate) return;
    setSaving(true);
    setError(null);
    try {
      await setLotFlightInfo(id, flightNumber, new Date(departureDate).toISOString());
      await refresh();
      notify.success('Informations de vol enregistrées.');
    } catch {
      setError("Impossible d'enregistrer les informations de vol.");
      notify.error("Impossible d'enregistrer les informations de vol.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdvanceStatus(next: LotStatus) {
    if (!id) return;
    setSaving(true);
    try {
      await updateLotStatus(id, next);
      await refresh();
      notify.success(`Statut du lot mis à jour : « ${LOT_STATUS_LABELS[next]} ».`);
    } finally {
      setSaving(false);
    }
  }

  const currentIndex = STATUS_ORDER.indexOf(lot.status);
  const nextStatus = STATUS_ORDER[currentIndex + 1];

  return (
    <AppShell>
      <div className="mb-2">
        <Link
          to="/lots"
          className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
        >
          ← Retour aux lots
        </Link>
      </div>
      <PageHeader
        title={lot.lotNumber}
        actions={<Badge tone={STATUS_TONE[lot.status]}>{LOT_STATUS_LABELS[lot.status]}</Badge>}
      />

      <div className="space-y-6">
        {/* Informations de vol */}
        <Card className="p-5">
          <h2 className="font-medium text-night-800 dark:text-slate-100 mb-3">
            Informations de vol
          </h2>
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
        </Card>

        {/* Progression statut */}
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

        {/* Colis assignés */}
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
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Aucun colis assigné à ce lot.
            </p>
          )}
        </Card>

        {/* Assignation de colis non assignés */}
        <Card className="p-5">
          <h2 className="font-medium text-night-800 dark:text-slate-100 mb-3">
            Assigner des colis en attente
          </h2>
          {unassignedColis.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Aucun colis en attente d'assignation.
            </p>
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
    </AppShell>
  );
}
