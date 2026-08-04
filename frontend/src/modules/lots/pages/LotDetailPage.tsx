import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { apiClient, ApiResponse } from '@/lib/apiClient';
import { getLot, Lot, LOT_STATUS_LABELS } from '../lots.api';
import { getRentabiliteLot, RentabiliteLot } from '../rentabilite.api';
import { Colis } from '@/modules/colis/colis.api';
import { listAlertes, Alerte } from '@/modules/alertes/alertes.api';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/layout/AppShell';
import { Badge, PageHeader, Tabs, TabItem } from '@/ui';
import { VueEnsembleTab } from '../components/tabs/VueEnsembleTab';
import { ColisTab } from '../components/tabs/ColisTab';
import { DepensesTab } from '../components/tabs/DepensesTab';
import { PaiementsTab } from '../components/tabs/PaiementsTab';
import { RentabiliteTab } from '../components/tabs/RentabiliteTab';
import { AlertesTab } from '../components/tabs/AlertesTab';

const STATUS_TONE: Record<Lot['status'], 'sky' | 'cargo' | 'amber' | 'green' | 'slate'> = {
  EN_RECEPTION: 'slate',
  FERME: 'slate',
  ENVOLE: 'sky',
  ARRIVE: 'sky',
  EN_DEDOUANEMENT: 'amber',
  EN_ENTREPOT: 'cargo',
  CLOTURE: 'green',
};

export default function LotDetailPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [lot, setLot] = useState<Lot | null>(null);
  const [unassignedColis, setUnassignedColis] = useState<Colis[]>([]);
  const [rentabilite, setRentabilite] = useState<RentabiliteLot | null>(null);
  const [rentabiliteLoading, setRentabiliteLoading] = useState(true);
  const [alertesCritiques, setAlertesCritiques] = useState<Alerte[]>([]);
  const [activeTab, setActiveTab] = useState('vue-ensemble');

  const canSeeFinance = user?.role === 'Admin' || user?.role === 'Agent Guinée';

  const refresh = useCallback(async () => {
    if (!id) return;
    const lotData = await getLot(id);
    setLot(lotData);

    const res = await apiClient.get<ApiResponse<Colis[]>>('/colis', {
      params: { status: 'ENREGISTRE' },
    });
    setUnassignedColis(res.data.data ?? []);

    if (canSeeFinance) {
      setRentabiliteLoading(true);
      try {
        const [rent, alertes] = await Promise.all([
          getRentabiliteLot(id),
          listAlertes({ lotId: id, niveau: 'CRITIQUE' }),
        ]);
        setRentabilite(rent);
        setAlertesCritiques(alertes);
      } finally {
        setRentabiliteLoading(false);
      }
    } else {
      setRentabiliteLoading(false);
    }
  }, [id, canSeeFinance]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!lot || !id) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24 text-slate-400 dark:text-slate-500">
          Chargement…
        </div>
      </AppShell>
    );
  }

  const tabs: TabItem[] = [
    { key: 'vue-ensemble', label: "Vue d'ensemble" },
    { key: 'colis', label: 'Colis' },
    ...(canSeeFinance
      ? [
          { key: 'depenses', label: 'Dépenses' },
          { key: 'paiements', label: 'Paiements clients' },
          { key: 'rentabilite', label: 'Rentabilité' },
          { key: 'alertes', label: 'Alertes', badge: alertesCritiques.length },
        ]
      : []),
  ];

  return (
    <AppShell>
      <div className="mb-2">
        <Link to="/lots" className="text-xs text-sky-600 dark:text-sky-400 hover:underline">
          ← Retour aux lots
        </Link>
      </div>
      <PageHeader
        title={lot.lotNumber}
        actions={<Badge tone={STATUS_TONE[lot.status]}>{LOT_STATUS_LABELS[lot.status]}</Badge>}
      />

      {canSeeFinance && alertesCritiques.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30 px-4 py-3 flex items-center gap-3 mb-6">
          <AlertTriangle size={20} className="text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            {alertesCritiques.length} alerte{alertesCritiques.length > 1 ? 's' : ''} critique
            {alertesCritiques.length > 1 ? 's' : ''} sur ce lot —{' '}
            <button onClick={() => setActiveTab('alertes')} className="underline">
              voir le détail
            </button>
          </p>
        </div>
      )}

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'vue-ensemble' && (
        <VueEnsembleTab
          lot={lot}
          rentabilite={rentabilite}
          rentabiliteLoading={rentabiliteLoading}
          unassignedColis={unassignedColis}
          onRefresh={refresh}
        />
      )}
      {activeTab === 'colis' && <ColisTab colis={lot.colis ?? []} />}
      {activeTab === 'depenses' && canSeeFinance && <DepensesTab lotId={id} lotNumber={lot.lotNumber} />}
      {activeTab === 'paiements' && canSeeFinance && <PaiementsTab lotId={id} lotColis={lot.colis ?? []} />}
      {activeTab === 'rentabilite' && canSeeFinance && <RentabiliteTab lotId={id} lotNumber={lot.lotNumber} />}
      {activeTab === 'alertes' && canSeeFinance && <AlertesTab lotId={id} />}
    </AppShell>
  );
}
