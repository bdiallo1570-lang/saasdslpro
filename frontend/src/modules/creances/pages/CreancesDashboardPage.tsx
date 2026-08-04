import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import {
  getCreancesKpis,
  listClientsDebiteurs,
  CreancesKpis,
  ClientDebiteur,
  RiskTier,
} from '../creances.api';
import { relancerClient } from '@/modules/paiements/paiements.api';
import { AppShell } from '@/layout/AppShell';
import { PageHeader, Card, Badge, Button, StatCard, notify } from '@/ui';

const RISK_LABELS: Record<RiskTier, string> = {
  FAIBLE: 'Récent',
  MOYEN: '8-30 jours',
  ELEVE: '> 30 jours',
};

const RISK_BADGE_TONE: Record<RiskTier, 'sky' | 'cargo' | 'green' | 'amber' | 'red' | 'slate'> = {
  FAIBLE: 'amber',
  MOYEN: 'cargo',
  ELEVE: 'red',
};

const listContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

// Seuil d'ancienneté au-delà duquel une ligne est surlignée en rouge — cohérent avec le
// seuil configurable jours_avant_alerte_creance côté backend (défaut 7 jours).
const SEUIL_ANCIENNETE_ALERTE_JOURS = 7;

export default function CreancesDashboardPage() {
  const [kpis, setKpis] = useState<CreancesKpis | null>(null);
  const [debiteurs, setDebiteurs] = useState<ClientDebiteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [relanceEnCours, setRelanceEnCours] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [k, d] = await Promise.all([getCreancesKpis(), listClientsDebiteurs()]);
      setKpis(k);
      setDebiteurs(d);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totalGeneralGnf = useMemo(() => debiteurs.reduce((sum, d) => sum + d.soldeDu, 0), [debiteurs]);

  async function handleRelance(clientId: string) {
    setRelanceEnCours(clientId);
    try {
      await relancerClient(clientId);
      setMessages((m) => ({ ...m, [clientId]: 'Relance envoyée ✓' }));
      notify.success('Relance envoyée sur WhatsApp.');
    } catch {
      setMessages((m) => ({ ...m, [clientId]: 'Échec de la relance' }));
      notify.error('Échec de la relance. Veuillez réessayer.');
    } finally {
      setRelanceEnCours(null);
    }
  }

  function handleExportExcel() {
    const rows = debiteurs.map((d) => ({
      Client: d.client.fullName,
      'Code client': d.client.clientCode,
      Téléphone: d.client.telephone ?? '',
      'Colis en attente': d.nombreColisEnAttente,
      'Total dû (GNF)': Math.round(d.soldeDu),
      'Total payé (GNF)': Math.round(d.montantPayeTotal),
      'Reste (GNF)': Math.round(d.soldeDu),
      'Ancienneté (jours)': d.ancienneteJours,
      Statut: RISK_LABELS[d.niveauRisque],
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `creances-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <PageHeader
        title="Suivi des créances & impayés"
        description="Vue d'ensemble des soldes clients et relances en cours."
      />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total créances clients"
          value={kpis?.totalCreances ?? 0}
          suffix="GNF"
          tone="cargo"
          loading={loading}
        />
        <StatCard
          label="Clients à risque (> 30j)"
          value={kpis?.clientsARisque ?? 0}
          tone="red"
          loading={loading}
        />
        <StatCard
          label="Paiements partiels"
          value={kpis?.paiementsPartiels ?? 0}
          tone="sky"
          loading={loading}
        />
      </section>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-medium text-night-800 dark:text-slate-100">
              Clients débiteurs ({debiteurs.length})
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Total général : <span className="font-semibold tabular-nums">{Math.round(totalGeneralGnf).toLocaleString('fr-FR')} GNF</span>
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExportExcel} disabled={debiteurs.length === 0}>
            Exporter Excel
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Chargement…</p>
        ) : debiteurs.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">
            Aucun client débiteur pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-night-700">
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-3 py-3 font-medium">Téléphone</th>
                  <th className="px-3 py-3 font-medium text-right">Colis en attente</th>
                  <th className="px-3 py-3 font-medium text-right">Total dû</th>
                  <th className="px-3 py-3 font-medium text-right">Total payé</th>
                  <th className="px-3 py-3 font-medium text-right">Reste</th>
                  <th className="px-3 py-3 font-medium">Ancienneté</th>
                  <th className="px-3 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <motion.tbody variants={listContainer} initial="hidden" animate="show">
                {debiteurs.map((d) => {
                  const surligne = d.ancienneteJours > SEUIL_ANCIENNETE_ALERTE_JOURS;
                  return (
                    <motion.tr
                      key={d.client.id}
                      variants={listItem}
                      className={`border-b border-slate-100 dark:border-night-700 last:border-0 ${
                        surligne ? 'bg-red-50 dark:bg-red-500/10' : ''
                      }`}
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium text-night-800 dark:text-slate-100">{d.client.fullName}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{d.client.clientCode}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{d.client.telephone ?? '—'}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{d.nombreColisEnAttente}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-medium text-night-900 dark:text-slate-100">
                        {Math.round(d.soldeDu + d.montantPayeTotal).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-green-600 dark:text-emerald-400">
                        {Math.round(d.montantPayeTotal).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold text-night-900 dark:text-slate-100">
                        {Math.round(d.soldeDu).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{d.ancienneteJours} j</td>
                      <td className="px-3 py-3">
                        <Badge tone={RISK_BADGE_TONE[d.niveauRisque]}>{RISK_LABELS[d.niveauRisque]}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={relanceEnCours === d.client.id}
                          onClick={() => handleRelance(d.client.id)}
                        >
                          Relancer
                        </Button>
                        {messages[d.client.id] && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{messages[d.client.id]}</p>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
