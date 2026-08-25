import { useState, useEffect, useCallback, FormEvent } from 'react';
import { CreditCard, Receipt, MessageCircle, Truck } from 'lucide-react';
import {
  Colis,
  updateColisStatus,
  getColisByTrackingId,
  dateReceptionEffective,
} from '../colis.api';
import {
  createPaiementColis,
  listPaiementsForColis,
  downloadRecuPaiement,
  Paiement,
  ModePaiement,
  MODE_PAIEMENT_LABELS,
  STATUT_PAIEMENT_LABELS,
} from '@/modules/lots/paiementsLot.api';
import { relancerClient } from '@/modules/paiements/paiements.api';
import { COLIS_STATUS_LABELS } from '@/modules/landing/trackingLabels';
import { extractErrorMessage } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { Modal, Tabs, Button, Input, Select, Badge, notify } from '@/ui';

const STATUT_TONE: Record<string, 'red' | 'amber' | 'green' | 'sky'> = {
  IMPAYE: 'red',
  PARTIEL: 'amber',
  SOLDE: 'green',
  TROP_PERCU: 'sky',
};

// Progression de statut côté Guinée — même règle que ScanArriveePage : jamais de retour en
// arrière, jamais de saut d'étape, une seule avancée possible à la fois.
const STATUT_SUIVANT_GUINEE: Record<string, string | undefined> = {
  ARRIVE: 'EN_DEDOUANEMENT',
  EN_DEDOUANEMENT: 'DISPONIBLE_ENTREPOT',
  DISPONIBLE_ENTREPOT: 'LIVRE',
};

const today = () => new Date().toISOString().slice(0, 10);

interface ColisActionsModalProps {
  colis: Colis | null;
  onClose: () => void;
  onUpdated?: (colis: Colis) => void;
}

// Panneau d'actions centralisé pour un colis — accessible en cliquant sur n'importe quelle ligne
// colis dans l'app (page Colis, onglet Colis d'un lot, Lots à régler). Regroupe en un seul
// endroit ce qui obligeait auparavant à naviguer entre plusieurs écrans : encaisser un paiement,
// télécharger le reçu, relancer le client sur WhatsApp, faire avancer le statut logistique.
export function ColisActionsModal({ colis: colisProp, onClose, onUpdated }: ColisActionsModalProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState('paiement');

  // Reflète colisProp à l'ouverture, mais se met à jour localement après chaque action (paiement,
  // avancée de statut) — sans ça, le badge/montants du panneau resteraient figés sur l'état
  // d'origine tant que la modal reste ouverte, même si l'action vient de réussir.
  const [colisActuel, setColisActuel] = useState<Colis | null>(colisProp);
  const colis = colisActuel ?? colisProp;

  const [historique, setHistorique] = useState<Paiement[]>([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  const [montant, setMontant] = useState('');
  const [currency, setCurrency] = useState('GNF');
  const [tauxVersGnf, setTauxVersGnf] = useState('');
  const [method, setMethod] = useState<ModePaiement>('ESPECES');
  const [reference, setReference] = useState('');
  const [datePaiement, setDatePaiement] = useState(today());
  const [commentaire, setCommentaire] = useState('');
  const [submittingPaiement, setSubmittingPaiement] = useState(false);

  const [relancing, setRelancing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const refreshHistorique = useCallback(async () => {
    if (!colis) return;
    setLoadingHistorique(true);
    try {
      setHistorique(await listPaiementsForColis(colis.id));
    } finally {
      setLoadingHistorique(false);
    }
  }, [colis]);

  useEffect(() => {
    if (!colisProp) return;
    setColisActuel(colisProp);
    setTab('paiement');
    setMontant(colisProp.resteAPayerGnf !== undefined ? String(Math.round(colisProp.resteAPayerGnf)) : '');
    setCurrency('GNF');
    setTauxVersGnf('');
    setMethod('ESPECES');
    setReference('');
    setDatePaiement(today());
    setCommentaire('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colisProp]);

  useEffect(() => {
    refreshHistorique();
  }, [refreshHistorique]);

  if (!colis) return null;

  // Recharge le colis complet depuis le serveur et met à jour l'état local — appelé après
  // chaque action qui change dû/payé/statut, pour que le panneau reste cohérent avec la
  // base sans devoir fermer/rouvrir la modal.
  async function refreshColis() {
    if (!colis) return;
    try {
      const updated = await getColisByTrackingId(colis.trackingId);
      setColisActuel(updated);
      onUpdated?.(updated);
    } catch {
      // Le rafraîchissement est un confort d'affichage — une erreur ici ne doit pas
      // masquer le succès de l'action qui vient d'avoir lieu.
    }
  }

  async function handlePaiementSubmit(e: FormEvent) {
    e.preventDefault();
    if (!colis || !colis.lotId || !montant || Number(montant) <= 0) return;
    setSubmittingPaiement(true);
    try {
      const { avertissement } = await createPaiementColis(colis.lotId, {
        colisId: colis.id,
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
      await refreshHistorique();
      await refreshColis();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setSubmittingPaiement(false);
    }
  }

  async function handleRelance() {
    if (!colis) return;
    setRelancing(true);
    try {
      await relancerClient(colis.client.id);
      notify.success('Message de relance envoyé sur WhatsApp.');
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setRelancing(false);
    }
  }

  async function handleAvancerStatut(nextStatus: string) {
    if (!colis) return;
    setUpdatingStatus(true);
    try {
      await updateColisStatus(colis.trackingId, nextStatus);
      notify.success(`Statut mis à jour : « ${COLIS_STATUS_LABELS[nextStatus] ?? nextStatus} ».`);
      await refreshColis();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setUpdatingStatus(false);
    }
  }

  const prochainStatut = STATUT_SUIVANT_GUINEE[colis.status];
  const peutAvancerStatut = user?.role !== 'Caissier' && prochainStatut;

  return (
    <Modal open={!!colis} onClose={onClose} title={colis.trackingId} maxWidthClassName="max-w-lg">
      <div className="mb-4">
        <p className="font-medium text-night-800 dark:text-slate-100">{colis.client.fullName}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {colis.description} · {colis.poidsReelKg} kg · Reçu le{' '}
          {new Date(dateReceptionEffective(colis)).toLocaleDateString('fr-FR')}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge tone="slate">{COLIS_STATUS_LABELS[colis.status] ?? colis.status}</Badge>
          {colis.statutPaiement && (
            <Badge tone={STATUT_TONE[colis.statutPaiement]}>{STATUT_PAIEMENT_LABELS[colis.statutPaiement]}</Badge>
          )}
        </div>
      </div>

      <Tabs
        tabs={[
          { key: 'paiement', label: 'Paiement' },
          { key: 'recu', label: 'Reçu' },
          { key: 'message', label: 'Message client' },
          { key: 'statut', label: 'Statut' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'paiement' && (
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 dark:bg-night-700 p-3 text-sm tabular-nums">
            Dû : {colis.montantDuGnf !== undefined ? Math.round(colis.montantDuGnf).toLocaleString('fr-FR') : '—'} ·{' '}
            Payé : {colis.montantPayeGnf !== undefined ? Math.round(colis.montantPayeGnf).toLocaleString('fr-FR') : '—'} ·{' '}
            Reste : {colis.resteAPayerGnf !== undefined ? Math.round(colis.resteAPayerGnf).toLocaleString('fr-FR') : '—'}
          </div>

          {!colis.lotId ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Ce colis n'est pas encore assigné à un lot — aucun paiement possible pour le moment.
            </p>
          ) : (
            <form onSubmit={handlePaiementSubmit} className="space-y-4">
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
              {colis.resteAPayerGnf !== undefined && Number(montant) > colis.resteAPayerGnf && colis.resteAPayerGnf > 0 && (
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
              <Input label="Référence (optionnel)" type="text" value={reference} onChange={(e) => setReference(e.target.value)} />
              <Input label="Date" type="date" required value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)} />
              <Input
                label="Commentaire (optionnel)"
                type="text"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
              />
              <Button
                type="submit"
                variant="cargo"
                fullWidth
                size="lg"
                loading={submittingPaiement}
                disabled={!montant || Number(montant) <= 0}
              >
                <CreditCard size={16} className="mr-2" />
                Enregistrer le paiement
              </Button>
            </form>
          )}
        </div>
      )}

      {tab === 'recu' && (
        <div className="space-y-3">
          {loadingHistorique ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Chargement…</p>
          ) : historique.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Aucun paiement enregistré pour ce colis — le reçu sera disponible ici après le premier encaissement.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-night-700">
              {historique.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="text-night-800 dark:text-slate-100">
                      {new Date(p.createdAt).toLocaleDateString('fr-FR')} · {MODE_PAIEMENT_LABELS[p.method]}
                    </p>
                    <p className="tabular-nums font-medium text-night-900 dark:text-slate-100">
                      {Number(p.montant).toLocaleString('fr-FR')} {p.currency}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadRecuPaiement(p.id, p.factureId)}
                  >
                    <Receipt size={14} className="mr-1.5" />
                    Télécharger le reçu
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'message' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Envoyer un message de relance sur WhatsApp au client, avec le solde restant dû (
            {colis.client.fullName}).
          </p>
          <Button
            variant="cargo"
            fullWidth
            size="lg"
            loading={relancing}
            onClick={handleRelance}
          >
            <MessageCircle size={16} className="mr-2" />
            Relancer sur WhatsApp
          </Button>
        </div>
      )}

      {tab === 'statut' && (
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 dark:bg-night-700 p-4">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Statut actuel</p>
            <p className="font-medium text-night-800 dark:text-slate-100">
              {COLIS_STATUS_LABELS[colis.status] ?? colis.status}
            </p>
          </div>
          {peutAvancerStatut ? (
            <Button
              variant="cargo"
              fullWidth
              size="lg"
              loading={updatingStatus}
              onClick={() => handleAvancerStatut(prochainStatut!)}
            >
              <Truck size={16} className="mr-2" />
              Passer à « {COLIS_STATUS_LABELS[prochainStatut!]} »
            </Button>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Aucune avancée de statut disponible pour le moment.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
