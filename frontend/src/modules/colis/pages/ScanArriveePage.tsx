import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrScanner } from '../components/QrScanner';
import { scanColis, marquerColisLivre, reportWeightDiscrepancy, ScanResult } from '../colis.api';
import { relancerClient } from '@/modules/paiements/paiements.api';
import { debloquerLivraison } from '@/modules/factures/factures.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Input, notify } from '@/ui';

export default function ScanArriveePage() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [motifDeblocage, setMotifDeblocage] = useState('');
  const [showDeblocageForm, setShowDeblocageForm] = useState(false);
  const [poidsGuinee, setPoidsGuinee] = useState('');
  const [signalingWeight, setSignalingWeight] = useState(false);
  const [weightSignaled, setWeightSignaled] = useState(false);

  async function handleScan(trackingId: string) {
    setScanning(false);
    setLoading(true);
    setError(null);
    setPoidsGuinee('');
    setWeightSignaled(false);
    try {
      const data = await scanColis(trackingId.trim());
      setResult(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignalerEcart() {
    if (!result || !poidsGuinee) return;
    setSignalingWeight(true);
    try {
      const discrepancy = await reportWeightDiscrepancy(result.colis.trackingId, Number(poidsGuinee));
      setWeightSignaled(true);
      notify.success(
        discrepancy.depasseSeuil
          ? "Écart signalé — au-delà du seuil, une alerte a été envoyée à l'Admin."
          : 'Écart signalé et journalisé (sous le seuil, aucune alerte nécessaire).',
      );
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setSignalingWeight(false);
    }
  }

  async function handleRelance() {
    if (!result) return;
    setLoading(true);
    try {
      await relancerClient(result.client.id);
      notify.success('Message de relance envoyé sur WhatsApp.');
    } catch (err) {
      setError(extractErrorMessage(err));
      notify.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeblocage() {
    if (!result?.facture || !motifDeblocage.trim()) return;
    setLoading(true);
    try {
      await debloquerLivraison(result.facture.id, motifDeblocage);
      notify.success("Livraison débloquée — motif tracé au journal d'audit.");
      const refreshed = await scanColis(result.colis.trackingId);
      setResult(refreshed);
      setShowDeblocageForm(false);
      setMotifDeblocage('');
    } catch (err) {
      setError(extractErrorMessage(err));
      notify.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleMarquerLivre() {
    if (!result) return;
    setLoading(true);
    try {
      await marquerColisLivre(result.colis.trackingId);
      notify.success('Colis marqué comme livré.');
      const refreshed = await scanColis(result.colis.trackingId);
      setResult(refreshed);
    } catch (err) {
      setError(extractErrorMessage(err));
      notify.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!scanning && !result && (
        <Button
          variant="cargo"
          fullWidth
          size="lg"
          onClick={() => {
            setResult(null);
            setError(null);
            setScanning(true);
          }}
        >
          Scanner un colis (QR Code)
        </Button>
      )}

      {scanning && (
        <div className="space-y-3">
          <QrScanner active={scanning} onScan={handleScan} />
          <Button variant="secondary" fullWidth onClick={() => setScanning(false)}>
            Annuler
          </Button>
        </div>
      )}

      {loading && <p className="text-center text-sm text-slate-400">Traitement en cours…</p>}

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
          {error}
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            key={result.colis.trackingId}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-5 space-y-4">
              <div className="text-center">
                <p className="text-xs text-slate-400">Colis</p>
                <p className="text-xl font-bold text-night-900 dark:text-slate-100">
                  {result.colis.trackingId}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{result.colis.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 dark:bg-night-700 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Client</p>
                  <p className="font-medium text-night-900 dark:text-slate-100">{result.client.fullName}</p>
                  <p className="text-xs text-slate-400">{result.client.clientCode}</p>
                </div>
                <div className="bg-slate-50 dark:bg-night-700 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Poids saisi en Chine (lecture seule)</p>
                  <p className="font-medium text-night-900 dark:text-slate-100">
                    {result.colis.poidsReelKg} kg
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-night-700 rounded-lg p-3 space-y-2">
                <p className="text-xs text-slate-400">Poids constaté à Conakry (contrôle)</p>
                {weightSignaled ? (
                  <p className="text-sm text-green-700 dark:text-emerald-300">
                    Écart signalé et journalisé.
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Poids constaté (kg)"
                      value={poidsGuinee}
                      onChange={(e) => setPoidsGuinee(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!poidsGuinee}
                      loading={signalingWeight}
                      onClick={handleSignalerEcart}
                    >
                      Signaler l'écart
                    </Button>
                  </div>
                )}
              </div>

              {!result.livraisonAutorisee ? (
                <div className="rounded-lg p-4 text-center bg-red-50 border-2 border-red-400 dark:bg-red-500/10 dark:border-red-500/50">
                  <p className="font-bold text-red-700 dark:text-red-300 text-base">
                    ⚠️ IMPAYÉ — LIVRAISON BLOQUÉE
                  </p>
                  {result.client.outstandingBalance !== undefined && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Solde restant : {Number(result.client.outstandingBalance).toLocaleString('fr-FR')} GNF
                    </p>
                  )}
                  {result.facture && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      Facture {result.facture.factureNumber} —{' '}
                      {result.facture.status === 'PARTIEL' ? 'paiement partiel' : 'impayée'}
                    </p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 !bg-white dark:!bg-night-800 border border-red-300 dark:border-red-500/40 !text-red-700 dark:!text-red-300"
                      onClick={handleRelance}
                    >
                      Relancer sur WhatsApp
                    </Button>
                    {user?.role === 'Admin' && (
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1"
                        onClick={() => setShowDeblocageForm((v) => !v)}
                      >
                        Débloquer la livraison
                      </Button>
                    )}
                  </div>

                  {showDeblocageForm && (
                    <div className="mt-3 text-left space-y-2">
                      <Input
                        label="Motif du déblocage (obligatoire, tracé à l'audit)"
                        type="text"
                        value={motifDeblocage}
                        onChange={(e) => setMotifDeblocage(e.target.value)}
                        placeholder="Motif du déblocage"
                        className="border-red-300 dark:border-red-500/40"
                      />
                      <Button
                        variant="danger"
                        fullWidth
                        disabled={!motifDeblocage.trim()}
                        loading={loading}
                        onClick={handleDeblocage}
                      >
                        Confirmer le déblocage
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg p-4 text-center bg-green-50 border border-green-200 dark:bg-emerald-500/10 dark:border-emerald-500/30">
                  <p className="font-semibold text-green-700 dark:text-emerald-300">
                    ✅ {result.paymentStatus === 'NON_FACTURE' ? 'Pas encore facturé' : 'Payé intégralement'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Sortie / livraison autorisée.
                  </p>
                  {result.colis.status !== 'LIVRE' && (
                    <Button
                      variant="cargo"
                      fullWidth
                      size="sm"
                      className="mt-3"
                      loading={loading}
                      onClick={handleMarquerLivre}
                    >
                      Marquer comme livré
                    </Button>
                  )}
                </div>
              )}

              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setResult(null);
                  setScanning(true);
                }}
              >
                Scanner un autre colis
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
