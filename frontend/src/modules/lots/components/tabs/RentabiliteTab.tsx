import { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { getRentabiliteLot, downloadBilanPdf, RentabiliteLot } from '../../rentabilite.api';
import { CATEGORIE_DEPENSE_LABELS } from '../../depenses.api';
import { Card, Button } from '@/ui';

// Palette neutre cohérente avec le thème dark premium (navy/bleu ciel/orange cargo).
const COULEURS_CATEGORIES = ['#F97316', '#38BDF8', '#22C55E', '#A78BFA', '#FBBF24', '#94A3B8'];

function formatGnf(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} GNF`;
}

interface RentabiliteTabProps {
  lotId: string;
  lotNumber: string;
}

// Onglet "Rentabilité" — compte de résultat, graphique anneau (dépenses par catégorie),
// graphique barres (CA vs Encaissé vs Dépenses vs Marge), bandeau si déficitaire.
export function RentabiliteTab({ lotId, lotNumber }: RentabiliteTabProps) {
  const [rentabilite, setRentabilite] = useState<RentabiliteLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRentabilite(await getRentabiliteLot(lotId));
    } finally {
      setLoading(false);
    }
  }, [lotId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleExport() {
    setExporting(true);
    try {
      await downloadBilanPdf(lotId, lotNumber);
    } finally {
      setExporting(false);
    }
  }

  if (loading || !rentabilite) {
    return <p className="text-sm text-slate-400 dark:text-slate-500 py-6">Chargement…</p>;
  }

  const { revenus, depenses, resultats } = rentabilite;
  const margeBrutePositive = resultats.margeBruteGnf >= 0;

  const dataAnneau = depenses.parCategorie
    .filter((d) => d.totalGnf > 0)
    .map((d) => ({ name: CATEGORIE_DEPENSE_LABELS[d.categorie], value: d.totalGnf }));

  const dataBarres = [
    { name: 'CA facturé', montant: revenus.caFactureGnf },
    { name: 'Encaissé', montant: revenus.encaissementsGnf },
    { name: 'Dépenses', montant: depenses.totalGnf },
    { name: 'Marge', montant: resultats.margeBruteGnf },
  ];

  return (
    <div className="space-y-6">
      {!margeBrutePositive && (
        <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30 px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            Ce lot est déficitaire de {formatGnf(Math.abs(resultats.margeBruteGnf))}.
          </p>
        </div>
      )}

      <Card className="p-5">
        <h2 className="font-medium text-night-800 dark:text-slate-100 mb-4">Compte de résultat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Revenus</p>
            <div className="flex justify-between"><span>Chiffre d'affaires facturé</span><span className="tabular-nums font-medium">{formatGnf(revenus.caFactureGnf)}</span></div>
            <div className="flex justify-between"><span>Encaissements réels</span><span className="tabular-nums font-medium">{formatGnf(revenus.encaissementsGnf)}</span></div>
            <div className="flex justify-between"><span>Créances en cours</span><span className="tabular-nums font-medium">{formatGnf(revenus.creancesEnCoursGnf)}</span></div>

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mt-4">Dépenses</p>
            {depenses.parCategorie.map((d) => (
              <div key={d.categorie} className="flex justify-between">
                <span>{CATEGORIE_DEPENSE_LABELS[d.categorie]}</span>
                <span className="tabular-nums">{formatGnf(d.totalGnf)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold border-t border-slate-100 dark:border-night-700 pt-1.5">
              <span>Total dépenses</span><span className="tabular-nums">{formatGnf(depenses.totalGnf)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Résultats</p>
            <div className="flex justify-between">
              <span>Marge brute théorique</span>
              <span className={`tabular-nums font-semibold ${margeBrutePositive ? 'text-green-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatGnf(resultats.margeBruteGnf)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Marge encaissée (trésorerie)</span>
              <span className="tabular-nums font-medium">{formatGnf(resultats.margeEncaisseeGnf)}</span>
            </div>
            <div className="flex justify-between"><span>Taux de marge</span><span className="tabular-nums">{resultats.tauxMargePourcent.toFixed(1)} %</span></div>
            <div className="flex justify-between"><span>Coût de revient / kg</span><span className="tabular-nums">{formatGnf(resultats.coutRevientParKgGnf)}</span></div>
            <div className="flex justify-between"><span>Marge / kg</span><span className="tabular-nums">{formatGnf(resultats.margeParKgGnf)}</span></div>
          </div>
        </div>

        <Button variant="secondary" className="mt-5" loading={exporting} onClick={handleExport}>
          Exporter le bilan du lot (PDF)
        </Button>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-medium text-night-800 dark:text-slate-100 mb-3">Répartition des dépenses</h2>
          {dataAnneau.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Aucune dépense saisie.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={dataAnneau} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                  {dataAnneau.map((_, i) => (
                    <Cell key={i} fill={COULEURS_CATEGORIES[i % COULEURS_CATEGORIES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatGnf(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-medium text-night-800 dark:text-slate-100 mb-3">CA vs Encaissé vs Dépenses vs Marge</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dataBarres}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(value) => formatGnf(Number(value))} />
              <Bar dataKey="montant" fill="#38BDF8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
