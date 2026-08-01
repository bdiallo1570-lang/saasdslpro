import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { simulatePrice, PriceSimulationResult } from '@/modules/colis/colis.api';
import { WarehouseAddressModal } from '@/modules/warehouses/WarehouseAddressModal';
import { AppShell } from '@/layout/AppShell';
import { Card, Button, Select, Input, PageHeader, StatCounter } from '@/ui';

export default function PortailClientPage() {
  const [categorie, setCategorie] = useState<'STANDARD' | 'RISQUE'>('STANDARD');
  const [poidsKg, setPoidsKg] = useState('');
  const [result, setResult] = useState<PriceSimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  useEffect(() => {
    if (!poidsKg || Number(poidsKg) <= 0) {
      setResult(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        setResult(await simulatePrice(categorie, Number(poidsKg)));
      } catch {
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [categorie, poidsKg]);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Espace Client"
          description="Estimez le prix de votre envoi et récupérez l'adresse de notre entrepôt en Chine."
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-6"
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-night-900 dark:text-slate-100 mb-1">
              Simuler le prix de mon envoi
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Estimation indicative — le montant final est confirmé lors de la réception à
              l'entrepôt de Guangzhou.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Select
                label="Catégorie"
                value={categorie}
                onChange={(e) => setCategorie(e.target.value as 'STANDARD' | 'RISQUE')}
              >
                <option value="STANDARD">Standard</option>
                <option value="RISQUE">Sensible / à risque</option>
              </Select>
              <Input
                label="Poids (kg)"
                type="number"
                min="0.01"
                step="0.01"
                value={poidsKg}
                onChange={(e) => setPoidsKg(e.target.value)}
                placeholder="Ex : 5"
              />
            </div>

            <div className="bg-cargo-50 border border-cargo-200 dark:bg-cargo-500/10 dark:border-cargo-500/30 rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-cargo-700 dark:text-cargo-300">Total estimé</p>
                {result && (
                  <p className="text-xs text-cargo-600/80 dark:text-cargo-400/80">
                    {result.poidsKg} kg × {Number(result.pricePerKg).toLocaleString('fr-FR')}{' '}
                    {result.currency}/kg
                  </p>
                )}
              </div>
              <p className="text-2xl font-bold text-cargo-600 dark:text-cargo-400">
                {loading ? (
                  '…'
                ) : result ? (
                  <>
                    <StatCounter
                      value={result.totalEstime}
                      duration={0.5}
                      formatter={(v) => Math.round(v).toLocaleString('fr-FR')}
                    />{' '}
                    {result.currency}
                  </>
                ) : (
                  '—'
                )}
              </p>
            </div>
          </Card>

          <Card className="p-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-night-800 dark:text-slate-100">
                Envoyer un colis vers la Chine ?
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Récupérez l'adresse de notre entrepôt à Guangzhou.
              </p>
            </div>
            <Button variant="cargo" onClick={() => setAddressModalOpen(true)} className="whitespace-nowrap">
              Obtenir l'adresse de l'entrepôt en Chine
            </Button>
          </Card>
        </motion.div>
      </div>

      <WarehouseAddressModal open={addressModalOpen} onClose={() => setAddressModalOpen(false)} />
    </AppShell>
  );
}
