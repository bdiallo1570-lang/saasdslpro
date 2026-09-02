import { useState, useEffect, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileDown } from 'lucide-react';
import { listLots, createLot, Lot, LotStatus, LOT_STATUS_LABELS } from '../lots.api';
import { downloadBilanPdf } from '../rentabilite.api';
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/layout/AppShell';
import { Card, Button, Badge, Input, PageHeader, SkeletonRow } from '@/ui';

const STATUS_TONE: Record<LotStatus, 'sky' | 'cargo' | 'amber' | 'green' | 'slate'> = {
  EN_RECEPTION: 'slate',
  FERME: 'slate',
  ENVOLE: 'sky',
  ARRIVE: 'sky',
  EN_DEDOUANEMENT: 'amber',
  EN_ENTREPOT: 'cargo',
  CLOTURE: 'green',
};

export default function LotsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const peutVoirRapport = hasPermission(user?.role, 'finance:read_margins');
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [flightNumber, setFlightNumber] = useState('');
  const [exportingId, setExportingId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setLots(await listLots());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreateLot() {
    setCreating(true);
    try {
      const lot = await createLot(flightNumber || undefined);
      setFlightNumber('');
      await refresh();
      navigate(`/lots/${lot.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleExportRapport(e: MouseEvent, lot: Lot) {
    e.stopPropagation();
    setExportingId(lot.id);
    try {
      await downloadBilanPdf(lot.id, lot.lotNumber);
    } finally {
      setExportingId(null);
    }
  }

  return (
    <AppShell>
      <PageHeader title="Gestion des lots / Manifeste aérien" />

      <Card className="p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <Input
              label="Nouveau lot — numéro de vol (optionnel)"
              type="text"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              placeholder="Ex : CZ6043"
            />
          </div>
          <Button variant="cargo" loading={creating} onClick={handleCreateLot}>
            + Créer un lot
          </Button>
        </div>
      </Card>

      {loading ? (
        <Card className="divide-y divide-slate-100 dark:divide-night-700 overflow-hidden">
          <SkeletonRow columns={3} />
          <SkeletonRow columns={3} />
          <SkeletonRow columns={3} />
        </Card>
      ) : lots.length === 0 ? (
        <p className="text-slate-400 text-sm">Aucun lot pour le moment.</p>
      ) : (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
        >
          {lots.map((lot) => (
            <motion.div
              key={lot.id}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <Card
                interactive
                onClick={() => navigate(`/lots/${lot.id}`)}
                className="px-5 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-night-800 dark:text-slate-100">{lot.lotNumber}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {lot.flightNumber ? `Vol ${lot.flightNumber}` : 'Vol non assigné'} ·{' '}
                    {lot._count?.colis ?? 0} colis
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {peutVoirRapport && (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={exportingId === lot.id}
                      onClick={(e) => handleExportRapport(e, lot)}
                    >
                      <FileDown size={14} className="mr-1.5" />
                      Rapport
                    </Button>
                  )}
                  <Badge tone={STATUS_TONE[lot.status]}>{LOT_STATUS_LABELS[lot.status]}</Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AppShell>
  );
}
