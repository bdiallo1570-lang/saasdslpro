import { useState, useEffect, useCallback, FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  listExchangeRates,
  createExchangeRate,
  ExchangeRate,
  ForeignCurrency,
} from '../exchangeRates.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { AppShell } from '@/layout/AppShell';
import { PageHeader, Card, Button, Input, Select, notify } from '@/ui';

const listContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

const today = () => new Date().toISOString().slice(0, 10);

// Taux de change manuels vers GNF, historisés (règle 3.2 GEMINI.md — jamais d'API externe,
// jamais de modification rétroactive d'un taux passé, toujours une nouvelle ligne datée).
export default function ExchangeRatesPage() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCurrency, setFromCurrency] = useState<ForeignCurrency>('USD');
  const [rate, setRate] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(today());
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRates(await listExchangeRates());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!rate) return;
    setSubmitting(true);
    try {
      await createExchangeRate({ fromCurrency, rate: Number(rate), effectiveFrom });
      notify.success('Taux de change enregistré.');
      setRate('');
      await refresh();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Taux de change"
        description="Taux manuels vers GNF, historisés — chaque nouveau taux est daté, les anciens sont conservés."
      />

      <Card className="p-5 mb-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <Select
            label="Devise"
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value as ForeignCurrency)}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="CNY">CNY</option>
          </Select>
          <Input
            label="Taux vers GNF"
            type="number"
            step="0.000001"
            min="0.000001"
            required
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
          <Input
            label="Date d'effet"
            type="date"
            required
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
          />
          <Button type="submit" variant="cargo" loading={submitting} disabled={!rate}>
            Enregistrer
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700">
          <h2 className="font-medium text-night-800 dark:text-slate-100">
            Historique des taux ({rates.length})
          </h2>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Chargement…</p>
        ) : rates.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">
            Aucun taux de change configuré pour le moment.
          </p>
        ) : (
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="divide-y divide-slate-100 dark:divide-night-700"
          >
            {rates.map((r) => (
              <motion.div
                key={r.id}
                variants={listItem}
                className="px-5 py-3 flex items-center justify-between gap-4"
              >
                <p className="font-medium text-night-800 dark:text-slate-100">
                  1 {r.fromCurrency} = {Number(r.rate).toLocaleString('fr-FR')} GNF
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Effectif depuis le {new Date(r.effectiveFrom).toLocaleDateString('fr-FR')}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>
    </AppShell>
  );
}
