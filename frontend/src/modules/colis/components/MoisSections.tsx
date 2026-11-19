import { Select } from '@/ui';
import { formatNumber } from '@/lib/format';
import { MoisColis } from '../colisParMois';

// Sélecteur « Tous les mois / Novembre 2026 (42) / … » ; valeur vide = tous les mois
export function MoisSelect({
  mois,
  value,
  onChange,
}: {
  mois: MoisColis[];
  value: string;
  onChange: (cle: string) => void;
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Mois de réception">
      <option value="">Tous les mois</option>
      {mois.map((m) => (
        <option key={m.cle} value={m.cle}>
          {m.libelle} ({m.colis.length})
        </option>
      ))}
    </Select>
  );
}

// En-tête d'un mois, collé en haut de la liste pendant le défilement
export function EnteteMois({ groupe }: { groupe: MoisColis }) {
  const kg = formatNumber(Math.round(groupe.poidsKg * 10) / 10, {
    maximumFractionDigits: 1,
  });
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-slate-100 bg-slate-50/95 px-5 py-2 backdrop-blur dark:border-night-700 dark:bg-night-900/95">
      <h3 className="text-sm font-semibold text-night-800 dark:text-slate-100">{groupe.libelle}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {groupe.colis.length} colis · {kg} kg
        {groupe.montants.map((m) => (
          <span key={m.currency} className="font-medium text-night-700 dark:text-slate-200">
            {' '}
            · {formatNumber(m.total)} {m.currency}
          </span>
        ))}
      </p>
    </div>
  );
}
