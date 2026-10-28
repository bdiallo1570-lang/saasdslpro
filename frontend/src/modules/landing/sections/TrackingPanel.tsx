import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calculator, Package, Plane, CheckCircle2, Loader2 } from 'lucide-react';
import { Magnetic } from './motionKit';
import { trackColisPublic, PublicTrackingResult } from '@/modules/colis/colis.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { COLIS_STATUS_LABELS } from '../trackingLabels';

// Actions principales de l'accueil : « Simuler mon tarif » et, quand il sera disponible, le suivi
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

  async function handleTrack(e: FormEvent) {
    e.preventDefault();
    if (!trackingId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await trackColisPublic(trackingId.trim()));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (!TRACKING_ENABLED) {
    return (
      <Magnetic strength={0.14} className="mt-7 inline-block">
        <button
          type="button"
          onClick={onSimulateClick}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-cargo-500 px-7 py-3.5 text-sm font-semibold text-white shadow-glow-cargo transition-colors hover:bg-cargo-400"
        >
          <Calculator size={16} />
          Simuler mon Tarif
        </button>
      </Magnetic>
    );
  }

  return (
    <div className="mt-6 text-left">
      <div className="rounded-2xl border border-white/15 bg-black/35 p-2 sm:p-3 flex flex-col gap-2 backdrop-blur-xl shadow-xl">
        <form onSubmit={handleTrack} className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Tracking ID (ex : DSL-2026-00042)"
              aria-label="Numéro de suivi du colis"
              className="w-full rounded-xl border border-white/20 bg-night-900/70 pl-9 pr-3 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white text-sm font-semibold px-4 sm:px-5 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
            Suivre
          </button>
        </form>

        <Magnetic strength={0.12} className="block">
          <button
            type="button"
            onClick={onSimulateClick}
            className="w-full bg-cargo-500 hover:bg-cargo-400 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-glow-cargo transition-colors inline-flex items-center justify-center gap-2"
          >
            <Calculator size={16} />
            Simuler mon Tarif
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
