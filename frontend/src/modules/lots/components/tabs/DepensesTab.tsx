import { useState, useEffect, useCallback, useMemo, FormEvent } from 'react';
import Papa from 'papaparse';
import {
  listDepensesByLot,
  createDepense,
  DepenseLot,
  SousTotalCategorie,
  CategorieDepenseLot,
  CATEGORIE_DEPENSE_LABELS,
} from '../../depenses.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { Card, Button, Input, Select, Modal, notify } from '@/ui';

// Dédouanement et Transport aéroport→Madina en premier — postes prioritaires métier.
const CATEGORIES_ORDONNEES: CategorieDepenseLot[] = [
  'DEDOUANEMENT',
  'TRANSPORT_AEROPORT_MADINA',
  'MANUTENTION',
  'STOCKAGE',
  'DOCUMENTATION',
  'DIVERS',
];

const today = () => new Date().toISOString().slice(0, 10);

interface DepensesTabProps {
  lotId: string;
  lotNumber: string;
}

// Onglet "Dépenses" — cartes de sous-totaux par catégorie, formulaire de création en modal,
// tableau filtrable, export CSV du relevé.
export function DepensesTab({ lotId, lotNumber }: DepensesTabProps) {
  const [depenses, setDepenses] = useState<DepenseLot[]>([]);
  const [sousTotaux, setSousTotaux] = useState<SousTotalCategorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreCategorie, setFiltreCategorie] = useState<CategorieDepenseLot | ''>('');
  const [modalOpen, setModalOpen] = useState(false);

  // Champs du formulaire de création
  const [categorie, setCategorie] = useState<CategorieDepenseLot>('DEDOUANEMENT');
  const [libelle, setLibelle] = useState('');
  const [montant, setMontant] = useState('');
  const [currency, setCurrency] = useState('GNF');
  const [tauxVersGnf, setTauxVersGnf] = useState('');
  const [dateDepense, setDateDepense] = useState(today());
  const [beneficiaire, setBeneficiaire] = useState('');
  const [referenceRecu, setReferenceRecu] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listDepensesByLot(lotId, filtreCategorie ? { categorie: filtreCategorie } : undefined);
      setDepenses(result.depenses);
      setSousTotaux(result.sousTotaux);
    } finally {
      setLoading(false);
    }
  }, [lotId, filtreCategorie]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const montantGnfPreview = useMemo(() => {
    const m = Number(montant) || 0;
    const taux = currency === 'GNF' ? 1 : Number(tauxVersGnf) || 0;
    return m * taux;
  }, [montant, tauxVersGnf, currency]);

  function resetForm() {
    setCategorie('DEDOUANEMENT');
    setLibelle('');
    setMontant('');
    setCurrency('GNF');
    setTauxVersGnf('');
    setDateDepense(today());
    setBeneficiaire('');
    setReferenceRecu('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!libelle.trim() || !montant) return;
    setSubmitting(true);
    try {
      await createDepense(lotId, {
        categorie,
        libelle,
        montant: Number(montant),
        currency,
        tauxVersGnf: currency === 'GNF' ? undefined : Number(tauxVersGnf),
        dateDepense,
        beneficiaire: beneficiaire || undefined,
        referenceRecu: referenceRecu || undefined,
      });
      notify.success('Dépense enregistrée.');
      setModalOpen(false);
      resetForm();
      await refresh();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleExportCsv() {
    const rows = depenses.map((d) => ({
      Date: new Date(d.dateDepense).toLocaleDateString('fr-FR'),
      Catégorie: CATEGORIE_DEPENSE_LABELS[d.categorie],
      Libellé: d.libelle,
      Bénéficiaire: d.beneficiaire ?? '',
      'Montant saisi': `${d.montant} ${d.currency}`,
      'Équivalent GNF': Math.round(Number(d.montantGnf)),
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `depenses-${lotNumber}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="cargo" onClick={() => setModalOpen(true)}>
          + Nouvelle dépense
        </Button>
        <div className="flex gap-2">
          <Select value={filtreCategorie} onChange={(e) => setFiltreCategorie(e.target.value as CategorieDepenseLot | '')}>
            <option value="">Toutes catégories</option>
            {CATEGORIES_ORDONNEES.map((c) => (
              <option key={c} value={c}>
                {CATEGORIE_DEPENSE_LABELS[c]}
              </option>
            ))}
          </Select>
          <Button variant="secondary" onClick={handleExportCsv} disabled={depenses.length === 0}>
            Exporter CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {sousTotaux.map((s) => (
          <Card key={s.categorie} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {CATEGORIE_DEPENSE_LABELS[s.categorie]}
            </p>
            <p className="mt-1.5 text-lg font-bold tabular-nums text-night-900 dark:text-slate-100">
              {Math.round(s.totalGnf).toLocaleString('fr-FR')}
              <span className="text-xs font-medium ml-1 opacity-70">GNF</span>
            </p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700">
          <h2 className="font-medium text-night-800 dark:text-slate-100">Dépenses ({depenses.length})</h2>
        </div>
        {loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Chargement…</p>
        ) : depenses.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Aucune dépense pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-night-700">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Catégorie</th>
                  <th className="px-3 py-3 font-medium">Libellé</th>
                  <th className="px-3 py-3 font-medium">Bénéficiaire</th>
                  <th className="px-3 py-3 font-medium text-right">Montant</th>
                  <th className="px-5 py-3 font-medium text-right">Équivalent GNF</th>
                </tr>
              </thead>
              <tbody>
                {depenses.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 dark:border-night-700 last:border-0">
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                      {new Date(d.dateDepense).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-3 py-3 text-night-800 dark:text-slate-100">
                      {CATEGORIE_DEPENSE_LABELS[d.categorie]}
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{d.libelle}</td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{d.beneficiaire ?? '—'}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {Number(d.montant).toLocaleString('fr-FR')} {d.currency}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-night-900 dark:text-slate-100">
                      {Math.round(Number(d.montantGnf)).toLocaleString('fr-FR')} GNF
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle dépense" maxWidthClassName="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Catégorie" value={categorie} onChange={(e) => setCategorie(e.target.value as CategorieDepenseLot)}>
            {CATEGORIES_ORDONNEES.map((c) => (
              <option key={c} value={c}>
                {CATEGORIE_DEPENSE_LABELS[c]}
              </option>
            ))}
          </Select>
          <Input label="Libellé" type="text" required value={libelle} onChange={(e) => setLibelle(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Montant"
              type="number"
              inputMode="numeric"
              min="0.01"
              step="0.01"
              required
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
            />
            <Select label="Devise" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="GNF">GNF</option>
            </Select>
          </div>
          {currency !== 'GNF' && (
            <div>
              <Input
                label="Taux vers GNF"
                type="number"
                inputMode="numeric"
                min="0.000001"
                step="0.000001"
                required
                value={tauxVersGnf}
                onChange={(e) => setTauxVersGnf(e.target.value)}
              />
              {montantGnfPreview > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ≈ {Math.round(montantGnfPreview).toLocaleString('fr-FR')} GNF
                </p>
              )}
            </div>
          )}
          <Input label="Date" type="date" required value={dateDepense} onChange={(e) => setDateDepense(e.target.value)} />
          <Input
            label="Bénéficiaire (optionnel)"
            type="text"
            value={beneficiaire}
            onChange={(e) => setBeneficiaire(e.target.value)}
          />
          <Input
            label="N° reçu (optionnel)"
            type="text"
            value={referenceRecu}
            onChange={(e) => setReferenceRecu(e.target.value)}
          />
          <Button type="submit" variant="cargo" fullWidth size="lg" loading={submitting}>
            Enregistrer
          </Button>
        </form>
      </Modal>
    </div>
  );
}
