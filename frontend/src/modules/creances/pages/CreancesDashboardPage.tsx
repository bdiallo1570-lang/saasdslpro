import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  FAIBLE: '< 7 jours',
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
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const listItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

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
        <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700">
          <h2 className="font-medium text-night-800 dark:text-slate-100">
            Clients débiteurs ({debiteurs.length})
          </h2>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Chargement…</p>
        ) : debiteurs.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">
            Aucun client débiteur pour le moment.
          </p>
        ) : (
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="divide-y divide-slate-100 dark:divide-night-700"
          >
            {debiteurs.map((d) => (
              <motion.div
                key={d.client.id}
                variants={listItem}
                className="px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-night-800 dark:text-slate-100 truncate">
                    {d.client.fullName}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {d.client.clientCode} · {d.nombreFactures} facture(s)
                    {d.aPaiementPartiel ? ' · paiement partiel' : ''}
                  </p>
                </div>

                <Badge tone={RISK_BADGE_TONE[d.niveauRisque]}>{RISK_LABELS[d.niveauRisque]}</Badge>

                <p className="font-semibold text-night-900 dark:text-slate-100 whitespace-nowrap">
                  {d.soldeDu.toLocaleString('fr-FR')} GNF
                </p>

                <div className="flex flex-col items-end gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={relanceEnCours === d.client.id}
                    onClick={() => handleRelance(d.client.id)}
                  >
                    Relancer sur WhatsApp
                  </Button>
                  {messages[d.client.id] && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {messages[d.client.id]}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>
    </AppShell>
  );
}
