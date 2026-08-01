import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientPicker } from '@/modules/clients/components/ClientPicker';
import { Client } from '@/modules/clients/clients.api';
import { createColis, simulatePrice, Colis, PricingCategory } from '../colis.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { ColisLabel } from '../components/ColisLabel';
import { AppShell } from '@/layout/AppShell';
import { Card, Button, Input, Textarea, Select, PageHeader, StatCounter, notify } from '@/ui';

const DIVISEUR_VOLUMETRIQUE = 6000;

export default function ReceptionPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [description, setDescription] = useState('');
  const [poidsReelKg, setPoidsReelKg] = useState('');
  const [longueurCm, setLongueurCm] = useState('');
  const [largeurCm, setLargeurCm] = useState('');
  const [hauteurCm, setHauteurCm] = useState('');
  const [categorie, setCategorie] = useState<PricingCategory>('STANDARD');
  const [tarifManuelParKg, setTarifManuelParKg] = useState('');
  const [motifTarifManuel, setMotifTarifManuel] = useState('');

  const [montantEstime, setMontantEstime] = useState<number | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdColis, setCreatedColis] = useState<Colis | null>(null);

  const poidsVolumetrique =
    longueurCm && largeurCm && hauteurCm
      ? (Number(longueurCm) * Number(largeurCm) * Number(hauteurCm)) / DIVISEUR_VOLUMETRIQUE
      : 0;
  const poidsTaxable = Math.max(Number(poidsReelKg) || 0, poidsVolumetrique);

  useEffect(() => {
    if (!poidsReelKg || Number(poidsReelKg) <= 0) {
      setMontantEstime(null);
      return;
    }
    if (categorie === 'PERSONNALISE') {
      setMontantEstime(tarifManuelParKg ? Number(poidsReelKg) * Number(tarifManuelParKg) : null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingEstimate(true);
      try {
        const result = await simulatePrice(categorie, Number(poidsReelKg));
        setMontantEstime(result.totalEstime);
      } catch {
        setMontantEstime(null);
      } finally {
        setLoadingEstimate(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [poidsReelKg, categorie, tarifManuelParKg]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!client) {
      setError('Veuillez sélectionner ou créer un client.');
      return;
    }
    if (categorie === 'PERSONNALISE' && (!tarifManuelParKg || !motifTarifManuel.trim())) {
      setError('Le tarif manuel et le motif sont requis pour la catégorie personnalisée.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const colis = await createColis({
        clientId: client.id,
        description,
        poidsReelKg: Number(poidsReelKg),
        longueurCm: longueurCm ? Number(longueurCm) : undefined,
        largeurCm: largeurCm ? Number(largeurCm) : undefined,
        hauteurCm: hauteurCm ? Number(hauteurCm) : undefined,
        categorieTarif: categorie,
        tarifManuelParKg: categorie === 'PERSONNALISE' ? Number(tarifManuelParKg) : undefined,
        motifTarifManuel: categorie === 'PERSONNALISE' ? motifTarifManuel : undefined,
      });
      setCreatedColis(colis);
      notify.success(`Colis enregistré — ${colis.trackingId}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setCreatedColis(null);
    setClient(null);
    setDescription('');
    setPoidsReelKg('');
    setLongueurCm('');
    setLargeurCm('');
    setHauteurCm('');
    setCategorie('STANDARD');
    setMontantEstime(null);
  }

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        {!createdColis ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="max-w-md mx-auto"
          >
            <PageHeader
              title="Réception — Chine"
              description="Enregistrer un nouveau colis reçu à l'entrepôt de Guangzhou"
            />

            <Card className="p-4 sm:p-5">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-night-700 dark:text-slate-300 mb-1.5">
                    Client
                  </label>
                  <ClientPicker selectedClient={client} onSelect={setClient} />
                </div>

                <Textarea
                  label="Description des marchandises"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Ex : 3 cartons vêtements"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Poids réel (kg)"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={poidsReelKg}
                    onChange={(e) => setPoidsReelKg(e.target.value)}
                  />
                  <Select
                    label="Catégorie"
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value as PricingCategory)}
                  >
                    <option value="STANDARD">Standard (160 000 GNF/kg)</option>
                    <option value="RISQUE">Sensible / à risque (180 000 GNF/kg)</option>
                    <option value="PERSONNALISE">Personnalisé (sur devis)</option>
                  </Select>
                </div>

                <div>
                  <p className="block text-sm font-medium text-night-700 dark:text-slate-300 mb-1.5">
                    Dimensions (cm) — pour le volume (optionnel)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Longueur"
                      value={longueurCm}
                      onChange={(e) => setLongueurCm(e.target.value)}
                    />
                    <Input
                      type="number"
                      min="0"
                      placeholder="Largeur"
                      value={largeurCm}
                      onChange={(e) => setLargeurCm(e.target.value)}
                    />
                    <Input
                      type="number"
                      min="0"
                      placeholder="Hauteur"
                      value={hauteurCm}
                      onChange={(e) => setHauteurCm(e.target.value)}
                    />
                  </div>
                  {poidsVolumetrique > 0 && (
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      Poids volumétrique : {poidsVolumetrique.toFixed(2)} kg · Poids taxable :{' '}
                      {poidsTaxable.toFixed(2)} kg (facturation au poids réel)
                    </p>
                  )}
                </div>

                <AnimatePresence>
                  {categorie === 'PERSONNALISE' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 bg-amber-50 border border-amber-200 rounded-xl p-3 dark:bg-amber-500/10 dark:border-amber-500/30">
                        <Input
                          label="Tarif manuel (GNF/kg)"
                          type="number"
                          min="1"
                          required
                          value={tarifManuelParKg}
                          onChange={(e) => setTarifManuelParKg(e.target.value)}
                        />
                        <Input
                          label="Motif (obligatoire, tracé au journal d'audit)"
                          type="text"
                          required
                          value={motifTarifManuel}
                          onChange={(e) => setMotifTarifManuel(e.target.value)}
                          placeholder="Ex : accord gros volume négocié avec le client"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:text-red-300 dark:bg-red-500/10 dark:border-red-500/30"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Card glow="cargo" className="px-4 py-3 flex items-center justify-between bg-cargo-50/60 dark:bg-cargo-500/5 border-cargo-200 dark:border-cargo-500/30">
                  <span className="text-sm font-medium text-night-800 dark:text-slate-200">
                    Montant estimé
                  </span>
                  <span className="text-2xl font-bold text-cargo-600 dark:text-cargo-400">
                    {loadingEstimate ? (
                      '…'
                    ) : montantEstime !== null ? (
                      <>
                        <StatCounter value={montantEstime} duration={0.5} /> GNF
                      </>
                    ) : (
                      '—'
                    )}
                  </span>
                </Card>

                <Button type="submit" variant="cargo" size="lg" loading={submitting} fullWidth>
                  {submitting ? 'Enregistrement…' : 'Enregistrer le colis'}
                </Button>
              </form>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="max-w-md mx-auto space-y-4"
          >
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30">
              Colis enregistré avec succès — {createdColis.trackingId}
            </div>

            <ColisLabel colis={createdColis} />

            <div className="flex gap-2 print:hidden">
              <Button variant="cargo" fullWidth onClick={() => window.print()}>
                Imprimer l'étiquette
              </Button>
              <Button variant="secondary" fullWidth onClick={resetForm}>
                Nouveau colis
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
