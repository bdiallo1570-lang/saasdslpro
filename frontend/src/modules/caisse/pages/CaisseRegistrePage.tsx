import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getOpenClosure,
  openClosure,
  createTransaction,
  closeClosure,
  downloadClosureReportPdf,
  CashRegisterClosure,
  CashTransactionType,
} from '../caisse.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { Button, Card, Input, Select, StatCard, notify } from '@/ui';

const DEPENSE_CATEGORIES = ['Douane', 'Manutention', 'Loyer', 'Carburant', 'Autre'];
const CURRENCY = 'GNF';

export default function CaisseRegistrePage() {
  const [closure, setClosure] = useState<CashRegisterClosure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fondOuverture, setFondOuverture] = useState('');

  const [type, setType] = useState<CashTransactionType>('ENTREE');
  const [label, setLabel] = useState('');
  const [montant, setMontant] = useState('');
  const [category, setCategory] = useState(DEPENSE_CATEGORIES[0]);
  const [method, setMethod] = useState<'ESPECES' | 'ORANGE_MONEY' | 'VIREMENT'>('ESPECES');
  const [saving, setSaving] = useState(false);

  const [comptagePhysique, setComptagePhysique] = useState('');
  const [showCloture, setShowCloture] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setClosure(await getOpenClosure(CURRENCY));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleOpen() {
    setSaving(true);
    setError(null);
    try {
      await openClosure(CURRENCY, Number(fondOuverture) || 0);
      notify.success('Caisse ouverte pour la journée.');
      await refresh();
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      notify.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTransaction() {
    if (!closure || !label.trim() || !montant) return;
    setSaving(true);
    setError(null);
    try {
      await createTransaction({
        closureId: closure.id,
        type,
        category: type === 'DEPENSE' ? category : undefined,
        label,
        montant: Number(montant),
        currency: CURRENCY,
        method: type === 'ENTREE' ? method : undefined,
      });
      notify.success('Transaction enregistrée.');
      setLabel('');
      setMontant('');
      await refresh();
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      notify.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleClose() {
    if (!closure || !comptagePhysique) return;
    setSaving(true);
    setError(null);
    try {
      const closed = await closeClosure(closure.id, Number(comptagePhysique));
      setClosure(closed);
      setShowCloture(false);
      notify.success('Caisse clôturée avec succès.');
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      notify.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadReport() {
    if (!closure) return;
    try {
      notify.success('Téléchargement du rapport en cours…');
      await downloadClosureReportPdf(closure.id, closure.date.slice(0, 10));
    } catch (err) {
      notify.error(extractErrorMessage(err));
    }
  }

  if (loading) {
    return <p className="text-center text-sm text-slate-400 py-10">Chargement…</p>;
  }

  if (!closure) {
    return (
      <Card className="p-5 space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Aucune caisse ouverte aujourd'hui pour {CURRENCY}.
        </p>
        <Input
          label="Fond d'ouverture (GNF)"
          type="number"
          min="0"
          value={fondOuverture}
          onChange={(e) => setFondOuverture(e.target.value)}
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <Button variant="cargo" fullWidth loading={saving} onClick={handleOpen}>
          Ouvrir la caisse du jour
        </Button>
      </Card>
    );
  }

  const entrees = closure.transactions.filter((t) => t.type === 'ENTREE');
  const depenses = closure.transactions.filter((t) => t.type === 'DEPENSE');
  const totalEntrees = entrees.reduce((s, t) => s + Number(t.montant), 0);
  const totalDepenses = depenses.reduce((s, t) => s + Number(t.montant), 0);
  const soldeTheorique = Number(closure.fondOuverture) + totalEntrees - totalDepenses;
  const estCloturee = closure.status === 'CLOTUREE';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Fond d'ouverture" value={Number(closure.fondOuverture)} tone="sky" suffix="GNF" />
        <StatCard label="Entrées" value={totalEntrees} tone="green" suffix="GNF" />
        <StatCard label="Dépenses" value={totalDepenses} tone="red" suffix="GNF" />
        <StatCard label="Solde théorique" value={soldeTheorique} tone="sky" suffix="GNF" />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!estCloturee && (
        <Card className="p-5 space-y-3">
          <h2 className="font-medium text-slate-800 dark:text-slate-200">Nouvelle transaction</h2>
          <div className="relative flex bg-slate-100 dark:bg-night-700 rounded-lg p-1 text-sm font-medium">
            <button
              onClick={() => setType('ENTREE')}
              className={`relative flex-1 py-2 rounded-md transition-colors ${
                type === 'ENTREE' ? 'text-white' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {type === 'ENTREE' && (
                <motion.span
                  layoutId="caisse-transaction-type"
                  className="absolute inset-0 bg-emerald-600 rounded-md shadow"
                />
              )}
              <span className="relative">Entrée (paiement)</span>
            </button>
            <button
              onClick={() => setType('DEPENSE')}
              className={`relative flex-1 py-2 rounded-md transition-colors ${
                type === 'DEPENSE' ? 'text-white' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {type === 'DEPENSE' && (
                <motion.span
                  layoutId="caisse-transaction-type"
                  className="absolute inset-0 bg-red-600 rounded-md shadow"
                />
              )}
              <span className="relative">Dépense</span>
            </button>
          </div>

          <Input
            label="Libellé"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Libellé (ex : paiement colis DSL-2026-00042)"
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Montant (GNF)"
              type="number"
              min="1"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="Montant (GNF)"
            />
            {type === 'ENTREE' ? (
              <Select
                label="Méthode"
                value={method}
                onChange={(e) => setMethod(e.target.value as typeof method)}
              >
                <option value="ESPECES">Espèces</option>
                <option value="ORANGE_MONEY">Orange Money (+224628674895)</option>
                <option value="VIREMENT">Virement</option>
              </Select>
            ) : (
              <Select label="Catégorie" value={category} onChange={(e) => setCategory(e.target.value)}>
                {DEPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <Button
            variant="primary"
            fullWidth
            loading={saving}
            disabled={!label.trim() || !montant}
            onClick={handleAddTransaction}
          >
            Enregistrer
          </Button>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="font-medium text-slate-800 dark:text-slate-200 mb-3">
          Journal du jour ({closure.transactions.length})
        </h2>
        {closure.transactions.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune transaction pour le moment.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-night-700 max-h-72 overflow-y-auto">
            {closure.transactions.map((t) => (
              <div key={t.id} className="py-2 flex justify-between text-sm">
                <span className="text-night-800 dark:text-slate-200">
                  {t.label} {t.category ? `(${t.category})` : ''}
                </span>
                <span
                  className={
                    t.type === 'ENTREE'
                      ? 'text-green-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }
                >
                  {t.type === 'ENTREE' ? '+' : '-'}
                  {Number(t.montant).toLocaleString('fr-FR')} {t.currency}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {!estCloturee ? (
        <Card className="p-5 space-y-3">
          {!showCloture ? (
            <Button variant="cargo" fullWidth onClick={() => setShowCloture(true)}>
              Clôturer la caisse du jour
            </Button>
          ) : (
            <>
              <Input
                label="Comptage physique (GNF)"
                type="number"
                min="0"
                value={comptagePhysique}
                onChange={(e) => setComptagePhysique(e.target.value)}
              />
              <AnimatePresence>
                {comptagePhysique && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-slate-500 dark:text-slate-400 overflow-hidden"
                  >
                    Écart prévisionnel :{' '}
                    <span
                      className={
                        Number(comptagePhysique) - soldeTheorique === 0
                          ? 'text-slate-700 dark:text-slate-300'
                          : Number(comptagePhysique) - soldeTheorique > 0
                            ? 'text-green-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {(Number(comptagePhysique) - soldeTheorique).toLocaleString('fr-FR')} GNF
                    </span>
                  </motion.p>
                )}
              </AnimatePresence>
              <Button
                variant="cargo"
                fullWidth
                loading={saving}
                disabled={!comptagePhysique}
                onClick={handleClose}
              >
                Confirmer la clôture
              </Button>
            </>
          )}
        </Card>
      ) : (
        <Card className="p-5 space-y-2 text-center">
          <p className="font-semibold text-slate-800 dark:text-slate-200">Caisse clôturée</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Comptage physique : {Number(closure.comptagePhysique).toLocaleString('fr-FR')} GNF
          </p>
          <p
            className={`text-sm font-medium ${
              Number(closure.ecart) === 0
                ? 'text-slate-700 dark:text-slate-300'
                : Number(closure.ecart) > 0
                  ? 'text-green-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
            }`}
          >
            Écart : {Number(closure.ecart) >= 0 ? '+' : ''}
            {Number(closure.ecart).toLocaleString('fr-FR')} GNF
          </p>
          <Button variant="cargo" fullWidth className="mt-2" onClick={handleDownloadReport}>
            Télécharger le rapport de clôture (PDF)
          </Button>
        </Card>
      )}
    </div>
  );
}
