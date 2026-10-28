import { useState, useEffect, useCallback, FormEvent } from 'react';
import { CreditCard, Receipt, Truck, Scale, DollarSign, AlertTriangle, FileText, Download } from 'lucide-react';
import {
  Colis,
  updateColisStatus,
  updateColisPrice,
  getColisByTrackingId,
  scanColis,
  marquerColisLivre,
  reportWeightDiscrepancy,
  ScanResult,
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
import { debloquerLivraison, downloadFacturePdf } from '@/modules/factures/factures.api';
import { RelancerWhatsAppButton } from '@/modules/paiements/components/RelancerWhatsAppButton';
import { COLIS_STATUS_LABELS } from '@/modules/landing/trackingLabels';
import { extractErrorMessage } from '@/lib/apiClient';
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/context/AuthContext';
import { Modal, Tabs, Button, Input, Select, Badge, notify } from '@/ui';

const STATUT_TONE: Record<string, 'red' | 'amber' | 'green' | 'sky'> = {
  IMPAYE: 'red',
  PARTIEL: 'amber',
  SOLDE: 'green',
  TROP_PERCU: 'sky',
};

// Séquence unique et complète des statuts modifiables manuellement — reflète exactement
// STATUTS_MODIFIABLES_MANUELLEMENT côté backend (colis.service.ts::updateColisStatus). LIVRE
// n'en fait pas partie côté serveur (verrou paiement dédié via marquerColisLivre) mais est
// ajouté ici en dernière position pour piloter l'affichage du bouton "suivant" dans l'UI.
const SEQUENCE_STATUTS = [
  'ENREGISTRE',
  'ASSIGNE_LOT',
  'ENVOLE',
  'ARRIVE',
  'EN_DEDOUANEMENT',
  'DISPONIBLE_ENTREPOT',
  'LIVRE',
] as const;

function prochainStatut(status: string): string | undefined {
  const index = SEQUENCE_STATUTS.indexOf(status as (typeof SEQUENCE_STATUTS)[number]);
  if (index === -1 || index === SEQUENCE_STATUTS.length - 1) return undefined;
  return SEQUENCE_STATUTS[index + 1];
}

const today = () => new Date().toISOString().slice(0, 10);

interface ColisActionsModalProps {
  colis: Colis | null;
  onClose: () => void;
  onUpdated?: (colis: Colis) => void;
}

// Panneau d'actions centralisé pour un colis — point unique de vérité pour toute action liée à
// un colis (page Colis, onglet Colis d'un lot, Lots à régler, panneau Client). Regroupe : infos,
// prix, paiement, reçu, écart de poids, statut/livraison, message client. Chaque onglet n'est
// construit que si le rôle connecté a la permission correspondante (frontend/src/lib/permissions.ts,
// miroir du backend — la vérification faisant autorité reste toujours côté serveur).
export function ColisActionsModal({ colis: colisProp, onClose, onUpdated }: ColisActionsModalProps) {
  const { user } = useAuth();
  const role = user?.role;
  const [tab, setTab] = useState('infos');

  // Reflète colisProp à l'ouverture, mais se met à jour localement après chaque action (paiement,
  // prix, statut) — sans ça, le panneau resterait figé sur l'état d'origine tant qu'il reste
  // ouvert, même après une action réussie.
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

  const [nouveauPrix, setNouveauPrix] = useState('');
  const [motifPrix, setMotifPrix] = useState('');
  const [submittingPrix, setSubmittingPrix] = useState(false);

  const [poidsGuinee, setPoidsGuinee] = useState('');
  const [signalingWeight, setSignalingWeight] = useState(false);

  const [downloadingDoc, setDownloadingDoc] = useState<'facture' | 'bonsortie' | null>(null);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [motifDeblocage, setMotifDeblocage] = useState('');
  const [showDeblocageForm, setShowDeblocageForm] = useState(false);

  const refreshHistorique = useCallback(async () => {
    if (!colis) return;
    setLoadingHistorique(true);
    try {
      setHistorique(await listPaiementsForColis(colis.id));
    } finally {
      setLoadingHistorique(false);
    }
  }, [colis]);

  // Le blocage de livraison (impayé) n'est renvoyé que par scanColis, pas par getColisByTrackingId
  // — appelé seulement quand l'onglet Statut est actif et pertinent, pour ne pas alourdir
  // inutilement les autres onglets d'une requête supplémentaire.
  const refreshScanResult = useCallback(async () => {
    if (!colis) return;
    setLoadingScan(true);
    try {
      setScanResult(await scanColis(colis.trackingId));
    } catch {
      setScanResult(null);
    } finally {
      setLoadingScan(false);
    }
  }, [colis]);

  useEffect(() => {
    // colisProp passe à null à la fermeture (onClose met selectedColis à null côté parent) —
    // sans ce cas, colisActuel garderait la dernière valeur non-null pour toujours (le composant
    // reste monté en permanence), donc `colis = colisActuel ?? colisProp` ne redeviendrait
    // jamais null et la modal resterait ouverte indéfiniment après le premier colis ouvert.
    if (!colisProp) {
      setColisActuel(null);
      return;
    }
    setColisActuel(colisProp);
    setTab('infos');
    setMontant(colisProp.resteAPayerGnf !== undefined ? String(Math.round(colisProp.resteAPayerGnf)) : '');
    setCurrency('GNF');
    setTauxVersGnf('');
    setMethod('ESPECES');
    setReference('');
    setDatePaiement(today());
    setCommentaire('');
    setNouveauPrix(colisProp.montantEstime ?? '');
    setMotifPrix('');
    setPoidsGuinee('');
    setMotifDeblocage('');
    setShowDeblocageForm(false);
    setScanResult(null);
  }, [colisProp]);

  useEffect(() => {
    refreshHistorique();
  }, [refreshHistorique]);

  useEffect(() => {
    if (tab === 'statut') refreshScanResult();
  }, [tab, refreshScanResult]);

  if (!colis) return null;

  // Recharge le colis complet depuis le serveur et met à jour l'état local — appelé après
  // chaque action qui change dû/payé/prix/statut, pour que le panneau reste cohérent avec la
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
    // Garde anti double-soumission : le bouton est désactivé pendant l'envoi, mais une
    // resoumission du <form> (ex. touche Entrée pressée deux fois très vite) contourne le
    // disabled du bouton — on bloque donc aussi ici, sur l'état lui-même.
    if (submittingPaiement) return;
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

  async function handlePrixSubmit() {
    if (!colis || !nouveauPrix || !motifPrix.trim()) return;
    setSubmittingPrix(true);
    try {
      await updateColisPrice(colis.trackingId, Number(nouveauPrix), motifPrix.trim());
      notify.success('Prix mis à jour.');
      setMotifPrix('');
      await refreshColis();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setSubmittingPrix(false);
    }
  }

  async function handleSignalerEcart() {
    if (!colis || !poidsGuinee) return;
    setSignalingWeight(true);
    try {
      const discrepancy = await reportWeightDiscrepancy(colis.trackingId, Number(poidsGuinee));
      notify.success(
        discrepancy.depasseSeuil
          ? "Écart signalé — au-delà du seuil, une alerte a été envoyée à l'Admin."
          : 'Écart signalé et journalisé (sous le seuil, aucune alerte nécessaire).',
      );
      setPoidsGuinee('');
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setSignalingWeight(false);
    }
  }

  async function handleAvancerStatut(nextStatus: string) {
    if (!colis) return;
    setUpdatingStatus(true);
    try {
      await updateColisStatus(colis.trackingId, nextStatus);
      notify.success(`Statut mis à jour : « ${COLIS_STATUS_LABELS[nextStatus] ?? nextStatus} ».`);
      await refreshColis();
      await refreshScanResult();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleMarquerLivre() {
    if (!colis) return;
    setUpdatingStatus(true);
    try {
      await marquerColisLivre(colis.trackingId);
      notify.success('Colis marqué comme livré.');
      await refreshColis();
      await refreshScanResult();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDeblocage() {
    if (!scanResult?.facture || !motifDeblocage.trim()) return;
    setUpdatingStatus(true);
    try {
      await debloquerLivraison(scanResult.facture.id, motifDeblocage);
      notify.success("Livraison débloquée — motif tracé au journal d'audit.");
      setShowDeblocageForm(false);
      setMotifDeblocage('');
      await refreshColis();
      await refreshScanResult();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setUpdatingStatus(false);
    }
  }

  const peutLirePrix = hasPermission(role, 'colis:read_pricing');
  const peutModifierPrix = hasPermission(role, 'colis:write_pricing');
  const peutPayer = hasPermission(role, 'paiements:write');
  const peutSignalerEcart = hasPermission(role, 'colis:report_weight_discrepancy');
  const peutChangerStatut = hasPermission(role, 'colis:update_status');
  const peutDebloquer = hasPermission(role, 'livraison:deblocage_force');
  const peutMessager = hasPermission(role, 'whatsapp:send');
  // Le backend verrouille le prix dès qu'un paiement existe, quel que soit le statut résultant
  // (PARTIEL, SOLDE, ou TROP_PERCU si le client a payé plus que dû) — seul IMPAYE (aucun
  // paiement) ou l'absence de facture laissent le prix modifiable.
  const prixVerrouille =
    colis.statutPaiement === 'PARTIEL' || colis.statutPaiement === 'SOLDE' || colis.statutPaiement === 'TROP_PERCU';

  const peutVoirDocuments = hasPermission(role, 'factures:read');

  const tabs = [
    { key: 'infos', label: 'Infos' },
    ...(peutModifierPrix ? [{ key: 'prix', label: 'Prix' }] : []),
    ...(peutPayer ? [{ key: 'paiement', label: 'Paiement' }] : []),
    ...(peutPayer ? [{ key: 'recu', label: 'Reçu' }] : []),
    ...(peutSignalerEcart ? [{ key: 'ecart', label: 'Écart de poids' }] : []),
    ...(peutChangerStatut ? [{ key: 'statut', label: 'Statut' }] : []),
    ...(peutVoirDocuments ? [{ key: 'documents', label: 'Documents' }] : []),
    ...(peutMessager ? [{ key: 'message', label: 'Message client' }] : []),
  ];

  const suivant = prochainStatut(colis.status);

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

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'infos' && (
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 dark:bg-night-700 p-3">
              <p className="text-xs text-slate-400 dark:text-slate-500">Client</p>
              <p className="font-medium text-night-900 dark:text-slate-100">{colis.client.fullName}</p>
              {colis.client.clientCode && <p className="text-xs text-slate-400 dark:text-slate-500">{colis.client.clientCode}</p>}
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-night-700 p-3">
              <p className="text-xs text-slate-400 dark:text-slate-500">Poids réel</p>
              <p className="font-medium text-night-900 dark:text-slate-100">{colis.poidsReelKg} kg</p>
            </div>
          </div>
          {peutLirePrix && colis.montantEstime !== undefined && (
            <div className="rounded-lg bg-slate-50 dark:bg-night-700 p-3">
              <p className="text-xs text-slate-400 dark:text-slate-500">Montant estimé</p>
              <p className="font-semibold text-night-900 dark:text-slate-100">
                {Number(colis.montantEstime).toLocaleString('fr-FR')} {colis.currency}
              </p>
            </div>
          )}
          {colis.lotId ? (
            <a href={`/lots/${colis.lotId}`} className="text-sky-600 dark:text-sky-400 hover:underline text-xs">
              Voir le lot de ce colis →
            </a>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500">Ce colis n'est pas encore assigné à un lot.</p>
          )}
        </div>
      )}

      {tab === 'prix' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Prix actuel :{' '}
            <span className="font-semibold text-night-900 dark:text-slate-100">
              {colis.montantEstime ? Number(colis.montantEstime).toLocaleString('fr-FR') : '—'} {colis.currency}
            </span>
          </p>
          {prixVerrouille ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Prix verrouillé — un paiement a déjà été enregistré sur ce colis.
            </p>
          ) : (
            <>
              <Input
                label={`Nouveau montant (${colis.currency ?? 'GNF'})`}
                type="number"
                min="1"
                value={nouveauPrix}
                onChange={(e) => setNouveauPrix(e.target.value)}
              />
              <Input
                label="Motif (obligatoire, tracé au journal d'audit)"
                type="text"
                value={motifPrix}
                onChange={(e) => setMotifPrix(e.target.value)}
                placeholder="Ex : correction erreur de saisie, renégociation client"
              />
              <Button
                variant="cargo"
                fullWidth
                size="lg"
                loading={submittingPrix}
                disabled={!nouveauPrix || !motifPrix.trim()}
                onClick={handlePrixSubmit}
              >
                <DollarSign size={16} className="mr-2" />
                Confirmer la modification
              </Button>
            </>
          )}
        </div>
      )}

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
          ) : colis.statutPaiement === 'SOLDE' || colis.statutPaiement === 'TROP_PERCU' ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Ce colis est déjà soldé — aucun nouveau paiement n'est nécessaire.
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
                  <Button variant="secondary" size="sm" onClick={() => downloadRecuPaiement(p.id, p.factureId)}>
                    <Receipt size={14} className="mr-1.5" />
                    Télécharger le reçu
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'ecart' && (
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 dark:bg-night-700 p-3">
            <p className="text-xs text-slate-400 dark:text-slate-500">Poids saisi en Chine (lecture seule)</p>
            <p className="font-medium text-night-900 dark:text-slate-100">{colis.poidsReelKg} kg</p>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Poids constaté à Conakry (kg)"
              value={poidsGuinee}
              onChange={(e) => setPoidsGuinee(e.target.value)}
              className="flex-1"
            />
            <Button variant="cargo" disabled={!poidsGuinee} loading={signalingWeight} onClick={handleSignalerEcart}>
              <Scale size={16} className="mr-1.5" />
              Signaler
            </Button>
          </div>
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

          {colis.status === 'DISPONIBLE_ENTREPOT' || colis.status === 'LIVRE' ? (
            loadingScan ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">Chargement…</p>
            ) : !scanResult ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Impossible de vérifier l'état de livraison pour le moment.
              </p>
            ) : !scanResult.livraisonAutorisee ? (
              <div className="rounded-lg p-4 text-center bg-red-50 border-2 border-red-400 dark:bg-red-500/10 dark:border-red-500/50">
                <p className="font-bold text-red-700 dark:text-red-300 text-base flex items-center justify-center gap-1.5">
                  <AlertTriangle size={16} />
                  IMPAYÉ — LIVRAISON BLOQUÉE
                </p>
                {scanResult.client.outstandingBalance !== undefined && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Solde restant : {Number(scanResult.client.outstandingBalance).toLocaleString('fr-FR')} GNF
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  {peutMessager && (
                    <RelancerWhatsAppButton mode="serveur" clientId={colis.client.id} size="sm" label="Relancer" />
                  )}
                  {peutDebloquer && (
                    <Button variant="danger" size="sm" className="flex-1" onClick={() => setShowDeblocageForm((v) => !v)}>
                      Débloquer la livraison
                    </Button>
                  )}
                </div>
                {showDeblocageForm && (
                  <div className="mt-3 text-left space-y-2">
                    <Input
                      label="Motif du déblocage (obligatoire, tracé à l'audit)"
                      type="text"
                      value={motifDeblocage}
                      onChange={(e) => setMotifDeblocage(e.target.value)}
                      placeholder="Motif du déblocage"
                      className="border-red-300 dark:border-red-500/40"
                    />
                    <Button
                      variant="danger"
                      fullWidth
                      disabled={!motifDeblocage.trim()}
                      loading={updatingStatus}
                      onClick={handleDeblocage}
                    >
                      Confirmer le déblocage
                    </Button>
                  </div>
                )}
              </div>
            ) : colis.status !== 'LIVRE' ? (
              <div className="rounded-lg p-4 text-center bg-green-50 border border-green-200 dark:bg-emerald-500/10 dark:border-emerald-500/30">
                <p className="font-semibold text-green-700 dark:text-emerald-300">✅ Livraison autorisée</p>
                <Button variant="cargo" fullWidth size="sm" className="mt-3" loading={updatingStatus} onClick={handleMarquerLivre}>
                  <Truck size={16} className="mr-2" />
                  Marquer comme livré
                </Button>
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center">Colis livré.</p>
            )
          ) : suivant ? (
            <Button variant="cargo" fullWidth size="lg" loading={updatingStatus} onClick={() => handleAvancerStatut(suivant)}>
              <Truck size={16} className="mr-2" />
              Passer à « {COLIS_STATUS_LABELS[suivant]} »
            </Button>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">Aucune avancée de statut disponible pour le moment.</p>
          )}
        </div>
      )}

      {tab === 'documents' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Téléchargez les documents officiels liés à ce colis.
          </p>

          {/* Facture PDF */}
          {colis.facture ? (
            <div className="rounded-lg border border-slate-200 dark:border-night-600 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sky-50 dark:bg-sky-500/10 p-2">
                  <FileText size={18} className="text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-night-800 dark:text-slate-100">{colis.facture.factureNumber}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Facture · {Number(colis.facture.montantTotal ?? 0).toLocaleString('fr-FR')} {colis.facture.currency ?? 'GNF'}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                loading={downloadingDoc === 'facture'}
                onClick={async () => {
                  if (!colis.facture) return;
                  setDownloadingDoc('facture');
                  try {
                    await downloadFacturePdf(colis.facture.id, colis.facture.factureNumber);
                  } catch (err) {
                    notify.error(extractErrorMessage(err));
                  } finally {
                    setDownloadingDoc(null);
                  }
                }}
              >
                <Download size={14} className="mr-1.5" />
                PDF
              </Button>
            </div>
          ) : (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-4 text-center">
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Aucune facture générée pour ce colis</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">La facture sera disponible dès que le caissier l'émettra.</p>
            </div>
          )}

          {/* Bon de sortie PDF */}
          {(colis.status === 'LIVRE' || colis.facture?.status === 'PAYE' || colis.facture?.livraisonDebloqueeManuel) && (
            <div className="rounded-lg border border-slate-200 dark:border-night-600 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-cargo-50 dark:bg-cargo-500/10 p-2">
                  <Truck size={18} className="text-cargo-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-night-800 dark:text-slate-100">Bon de sortie d'entrepôt</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Document de livraison officiel signé</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                loading={downloadingDoc === 'bonsortie'}
                onClick={async () => {
                  setDownloadingDoc('bonsortie');
                  try {
                    const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000') + '/api/v1';
                    const token = localStorage.getItem('dsl_token');
                    const resp = await fetch(
                      `${apiBase}/colis/${colis.trackingId}/bon-sortie-pdf`,
                      { headers: { Authorization: `Bearer ${token}` } },
                    );
                    if (!resp.ok) throw new Error('Impossible de générer le bon de sortie.');
                    const blob = await resp.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `bon-sortie-${colis.trackingId}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (err) {
                    notify.error(extractErrorMessage(err));
                  } finally {
                    setDownloadingDoc(null);
                  }
                }}
              >
                <Download size={14} className="mr-1.5" />
                PDF
              </Button>
            </div>
          )}
        </div>
      )}

      {tab === 'message' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Envoyer un message de relance sur WhatsApp au client ({colis.client.fullName}).
          </p>
          <RelancerWhatsAppButton mode="serveur" clientId={colis.client.id} fullWidth size="lg" />
        </div>
      )}
    </Modal>
  );
}
