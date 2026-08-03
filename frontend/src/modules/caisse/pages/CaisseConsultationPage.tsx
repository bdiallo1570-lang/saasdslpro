import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getOpenClosure, listClosures, CashRegisterClosure } from '../caisse.api';
import { AppShell } from '@/layout/AppShell';
import { PageHeader, Card, Badge, StatCard } from '@/ui';

const listContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

function soldeTheorique(closure: CashRegisterClosure) {
  const entrees = closure.transactions
    .filter((t) => t.type === 'ENTREE')
    .reduce((s, t) => s + Number(t.montant), 0);
  const depenses = closure.transactions
    .filter((t) => t.type === 'DEPENSE')
    .reduce((s, t) => s + Number(t.montant), 0);
  return Number(closure.fondOuverture) + entrees - depenses;
}

// Vue Admin en lecture seule de la Caisse — consultation de la caisse du jour et de
// l'historique des clôtures, sans possibilité d'ouvrir/clôturer ou saisir de transaction
// (ces actions restent réservées à l'Agent Guinée / Caissier sur CaisseHubPage).
export default function CaisseConsultationPage() {
  const [ouverte, setOuverte] = useState<CashRegisterClosure | null>(null);
  const [historique, setHistorique] = useState<CashRegisterClosure[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [o, h] = await Promise.all([getOpenClosure('GNF'), listClosures()]);
      setOuverte(o);
      setHistorique(h);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AppShell>
      <PageHeader
        title="Caisse — Consultation"
        description="Vue d'ensemble de la caisse du jour et de l'historique des clôtures (lecture seule)."
      />

      {ouverte && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Fond d'ouverture" value={Number(ouverte.fondOuverture)} tone="sky" suffix="GNF" loading={loading} />
          <StatCard
            label="Entrées"
            value={ouverte.transactions.filter((t) => t.type === 'ENTREE').reduce((s, t) => s + Number(t.montant), 0)}
            tone="green"
            suffix="GNF"
            loading={loading}
          />
          <StatCard
            label="Dépenses"
            value={ouverte.transactions.filter((t) => t.type === 'DEPENSE').reduce((s, t) => s + Number(t.montant), 0)}
            tone="red"
            suffix="GNF"
            loading={loading}
          />
          <StatCard label="Solde théorique" value={soldeTheorique(ouverte)} tone="sky" suffix="GNF" loading={loading} />
        </div>
      )}

      {!loading && ouverte && (
        <Card className="mb-8 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700">
            <h2 className="font-medium text-night-800 dark:text-slate-100">
              Journal du jour ({ouverte.transactions.length})
            </h2>
          </div>
          {ouverte.transactions.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">
              Aucune transaction pour le moment.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-night-700 max-h-72 overflow-y-auto">
              {ouverte.transactions.map((t) => (
                <div key={t.id} className="px-5 py-2.5 flex justify-between text-sm">
                  <span className="text-night-800 dark:text-slate-200">
                    {t.label} {t.category ? `(${t.category})` : ''}
                  </span>
                  <span
                    className={
                      t.type === 'ENTREE'
                        ? 'text-green-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {t.type === 'ENTREE' ? '+' : '-'}
                    {Number(t.montant).toLocaleString('fr-FR')} {t.currency}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700">
          <h2 className="font-medium text-night-800 dark:text-slate-100">
            Historique des clôtures ({historique.length})
          </h2>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Chargement…</p>
        ) : historique.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">
            Aucune caisse clôturée pour le moment.
          </p>
        ) : (
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="divide-y divide-slate-100 dark:divide-night-700"
          >
            {historique.map((c) => (
              <motion.div
                key={c.id}
                variants={listItem}
                className="px-5 py-3 flex items-center justify-between gap-4"
              >
                <p className="font-medium text-night-800 dark:text-slate-100">
                  {new Date(c.date).toLocaleDateString('fr-FR')} · {c.currency}
                </p>
                <Badge tone={c.status === 'CLOTUREE' ? 'green' : 'amber'}>
                  {c.status === 'CLOTUREE' ? 'Clôturée' : 'Ouverte'}
                </Badge>
                <p className="font-semibold text-night-900 dark:text-slate-100 whitespace-nowrap">
                  {c.ecart !== null ? `Écart : ${Number(c.ecart).toLocaleString('fr-FR')} GNF` : '—'}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>
    </AppShell>
  );
}
