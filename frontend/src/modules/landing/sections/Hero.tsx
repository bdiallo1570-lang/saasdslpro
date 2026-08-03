import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calculator, Package, Plane, CheckCircle2, Loader2 } from 'lucide-react';
import { trackColisPublic, PublicTrackingResult } from '@/modules/colis/colis.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { COLIS_STATUS_LABELS } from '../trackingLabels';
import { HeroBackgroundSlideshow } from './HeroBackgroundSlideshow';

interface HeroProps {
  onSimulateClick: () => void;
}

// Phrases défilantes du Hero — chacune met en avant un point fort différent du service.
const ROTATING_PHRASES = [
  {
    lead: 'La logistique Chine-Guinée, enfin',
    highlight: 'simplifiée, rapide et transparente',
  },
  {
    lead: 'Vos colis suivis en temps réel, de',
    highlight: 'Guangzhou jusqu\'à Madina',
  },
  {
    lead: 'Une tarification claire, sans surprise, dès',
    highlight: '160 000 GNF par kilo',
  },
  {
    lead: 'Suivi et notifications automatiques via',
    highlight: 'WhatsApp, à chaque étape',
  },
];

const PHRASE_INTERVAL_MS = 4200;

export function Hero({ onSimulateClick }: HeroProps) {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicTrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % ROTATING_PHRASES.length);
    }, PHRASE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  async function handleTrack(e: FormEvent) {
    e.preventDefault();
    if (!trackingId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await trackColisPublic(trackingId.trim());
      setResult(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="suivi" className="relative overflow-hidden bg-night-900">
      <HeroBackgroundSlideshow />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white drop-shadow-lg"
        >
          DSL Air Cargo
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="uppercase tracking-[0.25em] text-xs sm:text-sm font-semibold mt-3 mb-8 text-sky-300"
        >
          Fret aérien Chine → Guinée
        </motion.p>

        {/* Phrase défilante — transition en fondu + glissement + léger flou pour un effet marquant */}
        <div className="min-h-[4.5rem] sm:min-h-[3.5rem] flex items-center justify-center px-2">
          <AnimatePresence mode="wait">
            <motion.h1
              key={phraseIndex}
              initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -18, filter: 'blur(8px)' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-xl sm:text-2xl md:text-3xl font-medium max-w-2xl mx-auto leading-snug tracking-tight text-slate-100 drop-shadow-lg"
            >
              {ROTATING_PHRASES[phraseIndex].lead}{' '}
              <span className="bg-gradient-to-r from-sky-400 via-emerald-300 to-cargo-400 bg-clip-text text-transparent font-semibold">
                {ROTATING_PHRASES[phraseIndex].highlight}
              </span>
              .
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* Indicateurs de phrase */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {ROTATING_PHRASES.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === phraseIndex ? 'w-6 bg-sky-400' : 'w-1.5 bg-white/25'
              }`}
            />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 max-w-2xl mx-auto text-lg text-slate-200 drop-shadow"
        >
          Gérez vos expéditions de Guangzhou à Madina en temps réel. Suivi WhatsApp, tarification
          claire dès 160 000 GNF/kg et zéro frais cachés.
        </motion.p>

        {/* Cartes d'action rapides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 mx-auto max-w-2xl rounded-2xl border border-white/15 bg-white/10 p-2 sm:p-3 flex flex-col sm:flex-row gap-2 backdrop-blur-xl shadow-xl"
        >
          <form onSubmit={handleTrack} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Entrez votre Tracking ID (ex : DSL-2026-00042)"
                className="w-full rounded-xl border border-white/20 bg-night-900/60 pl-9 pr-3 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 transition-colors"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="shrink-0 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
              Suivre
            </motion.button>
          </form>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSimulateClick}
            className="shrink-0 bg-cargo-500 hover:bg-cargo-400 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-glow-cargo transition-colors inline-flex items-center justify-center gap-2"
          >
            <Calculator size={16} />
            Simuler mon Tarif
          </motion.button>
        </motion.div>

        {/* Résultat du suivi */}
        <AnimatePresence>
          {(result || error) && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              className="mt-4 max-w-2xl mx-auto overflow-hidden"
            >
              {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-left text-red-300">
                  {error}
                </div>
              ) : (
                result && (
                  <div className="rounded-xl border border-white/15 bg-white/10 backdrop-blur-xl px-5 py-4 text-left flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-emerald-500/15 text-emerald-300">
                        {result.status === 'LIVRE' ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <Plane size={18} />
                        )}
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

        {/* Aperçu dashboard flottant (glassmorphism) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
          className="mt-16 sm:mt-20 relative max-w-4xl mx-auto"
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-medium text-slate-400">Dashboard DSL Air Cargo</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Colis en transit', value: '128' },
                { label: 'Lots actifs', value: '9' },
                { label: 'Kg expédiés (mois)', value: '3 240' },
                { label: 'Livraisons à temps', value: '99%' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/5 bg-night-800/60 p-4 text-left">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs mt-1 text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Ombre portée décorative */}
          <div className="absolute -inset-4 -z-10 rounded-3xl blur-2xl bg-sky-500/10" />
        </motion.div>
      </div>
    </section>
  );
}
