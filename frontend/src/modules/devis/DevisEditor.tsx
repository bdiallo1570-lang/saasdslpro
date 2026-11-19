import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Plane, Plus, Ship, Trash2 } from 'lucide-react';
import { Button, Input, Modal, Select, Textarea, notify } from '@/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatNumber } from '@/lib/format';
import { listAllClients, ClientListItem } from '@/modules/clients/clients.api';
import { Devis, DevisLigneType, getTarifs, LIGNE_LABELS, LigneSaisie, prixApercu, prixSaisi, saveDevis, Tarifs } from './devis.api';

const UNITES: Record<Exclude<DevisLigneType, 'LIBRE'>, string> = {
  AERIEN_STANDARD: 'kg',
  AERIEN_SENSIBLE: 'kg',
  AERIEN_GROS_VOLUME: 'kg',
  MARITIME: 'm³',
};

function dansJours(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Ligne saisie : la quantité reste du texte pendant la frappe (« 2, » ou vide sont permis)
interface LigneForm {
  type: DevisLigneType;
  quantite: string;
  libelle: string;
  unite: string;
  prixUnitaire: string;
}

const nombre = (v: string) => Number(v.replace(',', '.'));

interface DevisEditorProps {
  open: boolean;
  devis: Devis | null;
  onClose: () => void;
  onSaved: (devis: Devis) => void;
}

// Création / modification d'un devis. Les prix des lignes avion et bateau viennent des tarifs en
// base (non modifiables ici) ; une négociation se fait par la remise.
export function DevisEditor({ open, devis, onClose, onSaved }: DevisEditorProps) {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [tarifs, setTarifs] = useState<Tarifs | null>(null);
  const [clientId, setClientId] = useState('');
  const [validUntil, setValidUntil] = useState(dansJours(15));
  const [lignes, setLignes] = useState<LigneForm[]>([]);
  const [remise, setRemise] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    listAllClients().then(setClients).catch(() => setClients([]));
    getTarifs()
      // Un devis existant garde le taux USD → GNF figé à sa création
      .then((t) => setTarifs(devis?.tauxUsdGnf ? { ...t, tauxUsdGnf: devis.tauxUsdGnf } : t))
      .catch(() => setTarifs(null));
    setClientId(devis?.client.id ?? '');
    setValidUntil(devis ? devis.validUntil.slice(0, 10) : dansJours(15));
    setRemise(devis?.remise ? String(devis.remise) : '');
    setNote(devis?.note ?? '');
    setLignes(
      devis
        ? devis.lignes.map((l) => ({
            type: l.type,
            quantite: String(l.quantite),
            // Pour une ligne catalogue, on ne garde que la précision entre parenthèses
            libelle: l.type === 'LIBRE' ? l.libelle : (l.libelle.match(/\(([^)]*)\)$/)?.[1] ?? ''),
            unite: l.unite,
            prixUnitaire: prixSaisi(l.type) ? String(l.prixUnitaire) : '',
          }))
        : [{ type: 'AERIEN_STANDARD', quantite: '', libelle: '', unite: 'kg', prixUnitaire: '' }],
    );
  }, [open, devis]);

  const saisies: LigneSaisie[] = lignes.map((l) => ({
    type: l.type,
    quantite: nombre(l.quantite),
    libelle: l.libelle.trim() || undefined,
    unite: l.type === 'LIBRE' ? l.unite.trim() || 'forfait' : undefined,
    prixUnitaire: prixSaisi(l.type) && l.prixUnitaire !== '' ? nombre(l.prixUnitaire) : undefined,
  }));

  const apercu = useMemo(() => {
    const montants = saisies.map((s) => {
      const pu = prixApercu(s, tarifs);
      return pu !== null && s.quantite > 0 ? Math.round(pu * s.quantite) : null;
    });
    const sousTotal = montants.reduce<number>((t, m) => t + (m ?? 0), 0);
    return { montants, sousTotal, total: Math.max(0, sousTotal - (nombre(remise) || 0)) };
  }, [saisies, tarifs, remise]);

  const maritimeSansTaux = lignes.some((l) => l.type === 'MARITIME') && tarifs !== null && !tarifs.tauxUsdGnf;

  function ajouter(type: DevisLigneType) {
    setLignes((ls) => [...ls, { type, quantite: '', libelle: '', unite: type === 'LIBRE' ? 'forfait' : UNITES[type], prixUnitaire: '' }]);
  }

  function modifier(i: number, patch: Partial<LigneForm>) {
    setLignes((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  }

  async function enregistrer() {
    if (!clientId) return notify.error('Choisissez un client.');
    setSaving(true);
    try {
      const saved = await saveDevis(
        {
          clientId,
          validUntil: `${validUntil}T23:59:59`,
          remise: nombre(remise) || 0,
          note: note.trim() || undefined,
          lignes: saisies,
        },
        devis?.id,
      );
      notify.success(devis ? `Devis ${saved.numero} mis à jour.` : `Devis ${saved.numero} créé.`);
      onSaved(saved);
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={devis ? `Modifier ${devis.numero}` : 'Nouveau devis'} maxWidthClassName="max-w-3xl">
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
          <Select label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Choisir un client…</option>
            {[...clients]
              .sort((a, b) => a.fullName.localeCompare(b.fullName, 'fr'))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.clientCode})
                </option>
              ))}
          </Select>
          <Input label="Valable jusqu'au" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-night-800 dark:text-slate-200">Lignes</p>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {lignes.map((l, i) => {
                const pu = prixApercu(saisies[i], tarifs);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-slate-200 p-3 dark:border-night-700"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {LIGNE_LABELS[l.type]}
                      </span>
                      <button
                        type="button"
                        onClick={() => setLignes((ls) => ls.filter((_, k) => k !== i))}
                        disabled={lignes.length === 1}
                        aria-label="Retirer la ligne"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_110px_90px_130px]">
                      <div className="col-span-2 sm:col-span-1">
                        <Input
                          placeholder={l.type === 'LIBRE' ? 'Désignation (ex. dédouanement)' : 'Précision facultative (ex. chaussures)'}
                          value={l.libelle}
                          onChange={(e) => modifier(i, { libelle: e.target.value })}
                        />
                      </div>
                      <Input
                        inputMode="decimal"
                        placeholder={`Quantité (${l.unite})`}
                        value={l.quantite}
                        onChange={(e) => modifier(i, { quantite: e.target.value })}
                      />
                      {l.type === 'LIBRE' ? (
                        <Input placeholder="Unité" value={l.unite} onChange={(e) => modifier(i, { unite: e.target.value })} />
                      ) : (
                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">{l.unite}</div>
                      )}
                      {prixSaisi(l.type) ? (
                        <Input
                          inputMode="numeric"
                          placeholder={l.type === 'LIBRE' ? 'Prix unitaire GNF' : 'Prix négocié GNF/kg'}
                          value={l.prixUnitaire}
                          onChange={(e) => modifier(i, { prixUnitaire: e.target.value })}
                        />
                      ) : (
                        <div className="flex flex-col justify-center text-right text-sm tabular-nums">
                          <span className="text-slate-700 dark:text-slate-200">{pu !== null ? `${formatNumber(pu)} GNF` : '—'}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {l.type === 'MARITIME' && tarifs?.maritimeUsdM3 ? `${tarifs.maritimeUsdM3} USD / m³` : `par ${l.unite}`}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-right text-sm font-semibold tabular-nums text-night-900 dark:text-slate-100">
                      {apercu.montants[i] !== null ? `${formatNumber(apercu.montants[i]!)} GNF` : '—'}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => ajouter('AERIEN_STANDARD')}>
              <Plane size={14} className="mr-1.5" /> Avion Standard
            </Button>
            <Button variant="secondary" size="sm" onClick={() => ajouter('AERIEN_SENSIBLE')}>
              <Plane size={14} className="mr-1.5" /> Avion Sensible
            </Button>
            <Button variant="secondary" size="sm" onClick={() => ajouter('AERIEN_GROS_VOLUME')}>
              <Plane size={14} className="mr-1.5" /> Avion Gros volume
            </Button>
            <Button variant="secondary" size="sm" onClick={() => ajouter('MARITIME')}>
              <Ship size={14} className="mr-1.5" /> Bateau
            </Button>
            <Button variant="secondary" size="sm" onClick={() => ajouter('LIBRE')}>
              <Plus size={14} className="mr-1.5" /> Ligne libre
            </Button>
          </div>
          {maritimeSansTaux && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              Aucun taux USD → GNF n'est configuré : ajoutez-le dans « Taux de change » pour chiffrer le bateau.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">
          <Textarea label="Note (imprimée sur le devis)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          <Input label="Remise (GNF)" inputMode="numeric" placeholder="0" value={remise} onChange={(e) => setRemise(e.target.value)} />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-night-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="tabular-nums">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sous-total {formatNumber(apercu.sousTotal)} GNF{nombre(remise) > 0 ? ` · remise ${formatNumber(nombre(remise))} GNF` : ''}
            </p>
            <p className="text-2xl font-bold text-night-900 dark:text-white">{formatNumber(apercu.total)} GNF</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button loading={saving} onClick={enregistrer}>
              {devis ? 'Enregistrer' : 'Créer le devis'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
