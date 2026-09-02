import { useState, useEffect, useCallback, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Fuse from 'fuse.js';
import {
  getPaiementsParClient,
  createPaiementColis,
  listPaiementsForColis,
  downloadRecuPaiement,
  ClientPaiementsGroupe,
  Paiement,
  ModePaiement,
  MODE_PAIEMENT_LABELS,
  STATUT_PAIEMENT_LABELS,
} from '../../paiementsLot.api';
import { Colis, StatutPaiementColis } from '@/modules/colis/colis.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { Card, Button, Input, Select, Badge, Modal, notify } from '@/ui';

const STATUT_TONE: Record<StatutPaiementColis, 'red' | 'amber' | 'green' | 'sky'> = {
  IMPAYE: 'red',
  PARTIEL: 'amber',
  SOLDE: 'green',
  TROP_PERCU: 'sky',
};

const today = () => new Date().toISOString().slice(0, 10);

interface PaiementsTabProps {
  lotId: string;
  lotColis: Colis[];
}

// Onglet "Paiements clients" — vue accordéon par client, modal d'encaissement avec recherche
// fuzzy de colis (limitée aux colis du lot), historique dépliable, reçu PDF téléchargeable.
export function PaiementsTab({ lotId, lotColis }: PaiementsTabProps) {
  const [groupes, setGroupes] = useState<ClientPaiementsGroupe[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [expandedColisId, setExpandedColisId] = useState<string | null>(null);
  const [historiqueParColis, setHistoriqueParColis] = useState<Record<string, Paiement[]>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);
  const [montant, setMontant] = useState('');
  const [currency, setCurrency] = useState('GNF');
  const [tauxVersGnf, setTauxVersGnf] = useState('');
  const [method, setMethod] = useState<ModePaiement>('ESPECES');
  const [reference, setReference] = useState('');
  const [datePaiement, setDatePaiement] = useState(today());
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setGroupes(await getPaiementsParClient(lotId));
    } finally {
      setLoading(false);
    }
  }, [lotId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const fuse = useMemo(
    () => new Fuse(lotColis, { keys: ['trackingId', 'client.fullName'], threshold: 0.35, ignoreLocation: true }),
    [lotColis],
  );
  const resultatsRecherche = useMemo(
    () => (query.trim() ? fuse.search(query.trim()).map((r) => r.item) : lotColis),
    [query, fuse, lotColis],
  );

  function openModal() {
    setSelectedColis(null);
    setQuery('');
    setMontant('');
    setCurrency('GNF');
    setTauxVersGnf('');
    setMethod('ESPECES');
    setReference('');
    setDatePaiement(today());
    setCommentaire('');
    setModalOpen(true);
  }

  function selectColis(c: Colis) {
    setSelectedColis(c);
    // Pré-remplit le montant avec le reste à payer (modifiable).
    setMontant(c.resteAPayerGnf !== undefined ? String(Math.round(c.resteAPayerGnf)) : '');
  }

  async function toggleHistorique(colisId: string) {
    if (expandedColisId === colisId) {
      setExpandedColisId(null);
      return;
    }
    setExpandedColisId(colisId);
    if (!historiqueParColis[colisId]) {
      const paiements = await listPaiementsForColis(colisId);
      setHistoriqueParColis((prev) => ({ ...prev, [colisId]: paiements }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedColis || !montant || Number(montant) <= 0) return;
    setSubmitting(true);
    try {
      const { avertissement } = await createPaiementColis(lotId, {
        colisId: selectedColis.id,
        montant: Number(montant),
        currency,
        tauxVersGnf: currency === 'GNF' ? undefined : Number(tauxVersGnf),
        method,
        reference: reference || undefined,
        datePaiement,
        commentaire: commentaire || undefined,
      });
      notify.success('Paiement enregistré.');
      if (avertissement) notify.error(avertissement);
      setModalOpen(false);
      setHistoriqueParColis((prev) => {
        const { [selectedColis.id]: _removed, ...rest } = prev;
        return rest;
      });
      await refresh();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="cargo" onClick={openModal}>
        + Enregistrer un paiement
      </Button>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700">
          <h2 className="font-medium text-night-800 dark:text-slate-100">Paiements par client ({groupes.length})</h2>
        </div>
        {loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Chargement…</p>
        ) : groupes.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Aucun colis facturé pour ce lot.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-night-700">
            {groupes.map((g) => {
              const expanded = expandedClientId === g.client.id;
              return (
                <div key={g.client.id}>
                  <button
                    onClick={() => setExpandedClientId(expanded ? null : g.client.id)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50 dark:hover:bg-night-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={16} className="text-slate-400 shrink-0" />
                      </motion.div>
                      <div className="min-w-0">
                        <p className="font-medium text-night-800 dark:text-slate-100 truncate">
                          {g.client.fullName} — {g.colis.length} colis
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                          Dû : {Math.round(g.dûGnf).toLocaleString('fr-FR')} · Payé :{' '}
                          {Math.round(g.payéGnf).toLocaleString('fr-FR')} · Reste :{' '}
                          {Math.round(g.resteGnf).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    {g.dûGnf <= 0 ? (
                      // dûGnf à 0 signifie qu'aucun colis de ce client n'est encore facturé
                      // (pas de Facture créée) — à ne jamais confondre avec "Soldé" (facturé
                      // ET payé). C'est la confusion qui a fait apparaître un client n'ayant
                      // rien payé comme "Soldé" alors que son colis n'avait simplement pas
                      // encore de facture.
                      <Badge tone="slate">Non facturé</Badge>
                    ) : g.resteGnf > 0 ? (
                      <Badge tone="red">Reste dû</Badge>
                    ) : (
                      <Badge tone="green">Soldé</Badge>
                    )}
                  </button>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-slate-50 dark:bg-night-900/40"
                      >
                        {g.colis.map((c) => (
                          <div key={c.colisId} className="px-5 py-2.5 border-t border-slate-100 dark:border-night-700">
                            <button
                              onClick={() => toggleHistorique(c.colisId)}
                              className="w-full flex items-center justify-between gap-3 text-sm"
                            >
                              <span className="text-night-700 dark:text-slate-200">{c.trackingId}</span>
                              <span className="tabular-nums text-slate-500 dark:text-slate-400">
                                {Math.round(c.dûGnf).toLocaleString('fr-FR')} / {Math.round(c.payéGnf).toLocaleString('fr-FR')} / {Math.round(c.resteGnf).toLocaleString('fr-FR')}
                              </span>
                              <Badge tone={STATUT_TONE[c.statutPaiement]}>{STATUT_PAIEMENT_LABELS[c.statutPaiement]}</Badge>
                            </button>
                            {expandedColisId === c.colisId && (
                              <div className="mt-2 pl-3 border-l-2 border-slate-200 dark:border-night-600 space-y-1">
                                {(historiqueParColis[c.colisId] ?? []).length === 0 ? (
                                  <p className="text-xs text-slate-400 dark:text-slate-500">Aucun paiement enregistré.</p>
                                ) : (
                                  historiqueParColis[c.colisId].map((p) => (
                                    <div key={p.id} className="flex items-center justify-between text-xs gap-2">
                                      <span className="text-slate-500 dark:text-slate-400">
                                        {new Date(p.createdAt).toLocaleDateString('fr-FR')} · {MODE_PAIEMENT_LABELS[p.method]}
                                      </span>
                                      <span className="tabular-nums font-medium text-night-700 dark:text-slate-200">
                                        {Number(p.montant).toLocaleString('fr-FR')} {p.currency}
                                      </span>
                                      <button
                                        onClick={() => downloadRecuPaiement(p.id, p.factureId)}
                                        className="text-sky-600 dark:text-sky-400 hover:underline"
                                      >
                                        Reçu
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Enregistrer un paiement" maxWidthClassName="max-w-md">
        {!selectedColis ? (
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Rechercher un colis (n° ou nom client)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-night-700">
              {resultatsRecherche.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectColis(c)}
                  className="w-full text-left py-2.5 px-1 text-sm hover:bg-slate-50 dark:hover:bg-night-700/50 rounded-md"
                >
                  <p className="font-medium text-night-800 dark:text-slate-100">
                    {c.trackingId} — {c.client.fullName}
                  </p>
                  {c.resteAPayerGnf !== undefined && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Reste à payer : {Math.round(c.resteAPayerGnf).toLocaleString('fr-FR')} GNF
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-slate-50 dark:bg-night-700 p-3 text-sm">
              <p className="font-medium text-night-800 dark:text-slate-100">
                {selectedColis.trackingId} — {selectedColis.client.fullName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                Dû : {selectedColis.montantDuGnf !== undefined ? Math.round(selectedColis.montantDuGnf).toLocaleString('fr-FR') : '—'} ·
                {' '}Déjà payé : {selectedColis.montantPayeGnf !== undefined ? Math.round(selectedColis.montantPayeGnf).toLocaleString('fr-FR') : '—'} ·
                {' '}Reste : {selectedColis.resteAPayerGnf !== undefined ? Math.round(selectedColis.resteAPayerGnf).toLocaleString('fr-FR') : '—'}
              </p>
              <button
                type="button"
                onClick={() => setSelectedColis(null)}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline mt-1"
              >
                Changer de colis
              </button>
            </div>

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
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="CNY">CNY</option>
              </Select>
            </div>
            {currency !== 'GNF' && (
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
            )}
            {selectedColis.resteAPayerGnf !== undefined &&
              Number(montant) > selectedColis.resteAPayerGnf &&
              selectedColis.resteAPayerGnf > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Le montant saisi dépasse le reste à payer — l'excédent sera enregistré comme trop-perçu.
                </p>
              )}

            <Select label="Mode de paiement" value={method} onChange={(e) => setMethod(e.target.value as ModePaiement)}>
              {Object.entries(MODE_PAIEMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              label="Référence (optionnel)"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
            <Input label="Date" type="date" required value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)} />
            <Input
              label="Commentaire (optionnel)"
              type="text"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
            />

            <Button type="submit" variant="cargo" fullWidth size="lg" loading={submitting} disabled={!montant || Number(montant) <= 0}>
              Enregistrer le paiement
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
