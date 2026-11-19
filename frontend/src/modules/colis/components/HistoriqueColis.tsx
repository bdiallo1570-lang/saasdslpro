import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { getHistoriqueColis, EntreeHistorique, ValeurHistorique } from '../colis.api';
import { COLIS_STATUS_LABELS } from '@/modules/landing/trackingLabels';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatNumber } from '@/lib/format';

const CATEGORIES: Record<string, string> = {
  STANDARD: 'Standard',
  RISQUE: 'Sensible',
  GROS_VOLUME: 'Gros volume',
  PERSONNALISE: 'Personnalisé',
};

// Valeur lisible selon le champ (dates, montants, catégories, statuts)
function afficher(champ: string, v: ValeurHistorique): string {
  if (v === null || v === '') return 'vide';
  if (champ === 'dateReception') {
    return new Date(String(v)).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  }
  if (champ === 'montantEstime') return `${formatNumber(Number(v))} GNF`;
  if (champ === 'prixKg') return `${formatNumber(Number(v))} GNF/kg`;
  if (champ === 'categorieTarif') return CATEGORIES[String(v)] ?? String(v);
  if (champ === 'status') return COLIS_STATUS_LABELS[String(v)] ?? String(v);
  if (typeof v === 'number') return formatNumber(v);
  return String(v);
}

// Empreinte de toutes les actions sur un colis : enregistrement, modifications (qui, quand,
// motif, avant → après), changements de statut. Lecture seule : le journal n'est jamais effacé.
// `version` : à incrémenter après une modification pour recharger l'historique.
export function HistoriqueColis({ trackingId, version = 0 }: { trackingId: string; version?: number }) {
  const [entrees, setEntrees] = useState<EntreeHistorique[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let actif = true;
    setErreur(null);
    getHistoriqueColis(trackingId)
      .then((h) => actif && setEntrees(h))
      .catch((e) => actif && setErreur(extractErrorMessage(e)));
    return () => {
      actif = false;
    };
  }, [trackingId, version]);

  if (erreur) return <p className="text-sm text-red-500">{erreur}</p>;
  if (!entrees) return <p className="text-sm text-slate-500 dark:text-slate-400">Chargement…</p>;
  if (entrees.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Aucune action enregistrée pour ce colis.</p>;
  }

  return (
    <ol className="relative ml-1.5 space-y-4 border-l border-slate-200 pl-5 dark:border-night-600">
      {entrees.map((e, i) => (
        <motion.li
          key={e.id}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i, 8) * 0.04 }}
          className="relative"
        >
          <span
            className={`absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-white dark:ring-night-800 ${
              e.action === 'colis:modifie' || e.action === 'colis:prix_modifie'
                ? 'bg-cargo-500'
                : 'bg-slate-300 dark:bg-night-500'
            }`}
          />
          <p className="text-sm font-medium text-night-800 dark:text-slate-100">{e.libelle}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {new Date(e.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })} · {e.auteur}
            {e.role ? ` (${e.role})` : ''}
          </p>
          {e.motif && <p className="mt-1 text-xs italic text-slate-600 dark:text-slate-300">Motif : « {e.motif} »</p>}
          {e.changements.length > 0 && (
            <ul className="mt-2 space-y-1 rounded-lg bg-slate-50 p-2.5 text-xs dark:bg-night-900/60">
              {e.changements.map((c) => (
                <li key={c.champ} className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  <span className="font-medium text-night-700 dark:text-slate-200">{c.libelle} :</span>
                  <span className="text-slate-500 line-through decoration-slate-400/60 dark:text-slate-400">
                    {afficher(c.champ, c.avant)}
                  </span>
                  <ArrowRight size={11} className="text-slate-400" aria-label="devient" />
                  <span className="font-semibold text-night-900 dark:text-slate-100">{afficher(c.champ, c.apres)}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.li>
      ))}
    </ol>
  );
}
