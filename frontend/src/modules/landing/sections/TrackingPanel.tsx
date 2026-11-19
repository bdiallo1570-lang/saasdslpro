import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calculator, Package, Plane, CheckCircle2, Loader2 } from 'lucide-react';
import { Magnetic } from './motionKit';
import { trackColisPublic, PublicTrackingResult } from '@/modules/colis/colis.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { COLIS_STATUS_LABELS } from '../trackingLabels';
import { z } from 'zod';
import { numeroSuivi, useValidation } from '@/lib/validation';
import { BoutonDevis } from '../devis/BoutonDevis';

// Actions de l'accueil : l'appel à l'action unique « Demander mon devis gratuit » (lien secondaire
// vers le calculateur) et, quand il sera disponible, le suivi
// public d'un colis. Le suivi est désactivé tant que TRACKING_ENABLED est à false (le formulaire,
// le menu, la FAQ et l'assistant n'en parlent plus) ; le remettre à true suffit à le réactiver,
// après avoir rétabli le lien « Suivi de colis » du menu et du pied de page. Affiché sur la
// première image de la vidéo (voir VideoScrollStory).
const TRACKING_ENABLED = false;

export function TrackingPanel({ onSimulateClick }: { onSimulateClick: () => void }) {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicTrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { erreurs, valider, effacer } = useValidation(z.object({ trackingId: numeroSuivi }));

  async function handleTrack(e: FormEvent) {
    e.preventDefault();
    const numero = valider({ trackingId });
    if (!numero) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await trackColisPublic(numero.trackingId));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Action unique : la demande de devis ; le calculateur reste accessible par un simple lien
  if (!TRACKING_ENABLED) {
    return (
      <div className="mt-7 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-5 lg:justify-start">
        <BoutonDevis emplacement="accueil" taille="large" />
        <button
          type="button"
          onClick={onSimulateClick}
          className="inline-flex items-center gap-1.5 py-2 text-sm font-medium text-cream/85 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          <Calculator size={15} aria-hidden="true" />
          ou calculer mon prix
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 text-left">
      <div className="rounded-2xl border border-white/15 bg-black/35 p-2 sm:p-3 flex flex-col gap-2 backdrop-blur-xl shadow-xl">
        <form onSubmit={handleTrack} noValidate className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={trackingId}
              aria-invalid={erreurs.trackingId ? true : undefined}
              aria-describedby={erreurs.trackingId ? 'suivi-erreur' : undefined}
              onChange={(e) => {
                setTrackingId(e.target.value);
                effacer('trackingId');
              }}
              placeholder="Tracking ID (ex : DSL-2026-00042)"
              aria-label="Numéro de suivi du colis"
              className="w-full rounded-xl border border-white/20 bg-night-900/70 pl-9 pr-3 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-ink-950 text-sm font-semibold px-4 sm:px-5 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
            Suivre
          </button>
        </form>
        {erreurs.trackingId && (
          <p id="suivi-erreur" role="alert" className="px-2 text-xs text-red-300">
            {erreurs.trackingId}
          </p>
        )}

        <Magnetic strength={0.12} className="block">
          <button
            type="button"
            onClick={onSimulateClick}
            className="w-full border border-white/25 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
          >
            <Calculator size={16} />
            Calculer mon prix
          </button>
        </Magnetic>
      </div>

      <AnimatePresence>
        {(result || error) && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            className="mt-3 overflow-hidden"
          >
            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-950/60 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : (
              result && (
                <div className="rounded-xl border border-white/15 bg-black/45 backdrop-blur-xl px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-emerald-500/20 text-emerald-300">
                      {result.status === 'LIVRE' ? <CheckCircle2 size={18} /> : <Plane size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{result.trackingId}</p>
                      <p className="text-xs text-slate-300">
                        {COLIS_STATUS_LABELS[result.status] ?? result.status}
                      </p>
                    </div>
                  </div>
                  {result.lot?.estimatedArrival && (
                    <p className="text-xs text-right text-slate-300">
                      ETA Conakry
                      <br />
                      <span className="text-slate-100">
                        {new Date(result.lot.estimatedArrival).toLocaleDateString('fr-FR')}
                      </span>
                    </p>
                  )}
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
