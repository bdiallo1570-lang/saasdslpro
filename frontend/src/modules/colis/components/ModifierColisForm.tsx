import { useEffect, useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import { ClientPicker } from '@/modules/clients/components/ClientPicker';
import { Client } from '@/modules/clients/clients.api';
import { Colis, ModifierColisInput, modifierColis, simulatePrice, dateReceptionEffective } from '../colis.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { Button, Input, Textarea, Select, notify } from '@/ui';
import { formatNumber } from '@/lib/format';

type Categorie = 'STANDARD' | 'RISQUE' | 'GROS_VOLUME' | 'PERSONNALISE';

// ISO → valeur d'un champ datetime-local (heure locale), et inversement
const versChampDate = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const nombreOuNull = (v: string) => (v.trim() === '' ? null : Number(v));
const texte = (v: string | number | null | undefined) => (v === null || v === undefined ? '' : String(Number(v)));

interface Props {
  colis: Colis;
  onUpdated: (colis: Colis) => void;
}

// Correction des informations saisies d'un colis (Admin, Agent Chine). Seuls les champs changés
// sont envoyés ; le motif est obligatoire et le serveur conserve chaque valeur avant → après dans
// l'historique. Après un paiement, seuls la description et la date restent modifiables, et un
// colis déjà facturé ne change plus de client (verrous appliqués aussi côté serveur).
export function ModifierColisForm({ colis, onUpdated }: Props) {
  const poidsInitial = Number(colis.poidsReelKg);
  const montantInitial = Number(colis.montantEstime ?? 0);
  // Prix au kilo réellement appliqué (inclut un prix négocié ou une correction de prix)
  const prixKgInitial = poidsInitial > 0 ? Math.round((montantInitial / poidsInitial) * 100) / 100 : 0;
  const dateInitiale = versChampDate(dateReceptionEffective(colis));

  const [client, setClient] = useState<Client | null>(colis.client as Client);
  const [description, setDescription] = useState(colis.description);
  const [poids, setPoids] = useState(String(poidsInitial));
  const [longueur, setLongueur] = useState(texte(colis.longueurCm));
  const [largeur, setLargeur] = useState(texte(colis.largeurCm));
  const [hauteur, setHauteur] = useState(texte(colis.hauteurCm));
  const [categorie, setCategorie] = useState<Categorie>(colis.categorieTarif as Categorie);
  const [prixNegocie, setPrixNegocie] = useState(colis.categorieTarif === 'GROS_VOLUME' ? String(prixKgInitial) : '');
  const [date, setDate] = useState(dateInitiale);
  const [motif, setMotif] = useState('');
  const [tarifDuJour, setTarifDuJour] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const paye =
    colis.statutPaiement === 'PARTIEL' || colis.statutPaiement === 'SOLDE' || colis.statutPaiement === 'TROP_PERCU';
  const clientVerrouille = paye || !!colis.facture;

  const categorieChange = categorie !== colis.categorieTarif;
  // Tarif en vigueur de la nouvelle catégorie (Standard en Gros volume, comme plafond)
  useEffect(() => {
    if (categorie === 'PERSONNALISE') return setTarifDuJour(null);
    simulatePrice(categorie === 'GROS_VOLUME' ? 'STANDARD' : categorie, 1)
      .then((r) => setTarifDuJour(Number(r.pricePerKg)))
      .catch(() => setTarifDuJour(null));
  }, [categorie]);

  // Champs réellement modifiés, seuls envoyés au serveur
  const changements = useMemo(() => {
    const c: Omit<ModifierColisInput, 'motif'> = {};
    if (client && client.id !== colis.client.id) c.clientId = client.id;
    if (description.trim() !== colis.description) c.description = description.trim();
    if (Number(poids) !== poidsInitial) c.poidsReelKg = Number(poids);
    if (nombreOuNull(longueur) !== (colis.longueurCm == null ? null : Number(colis.longueurCm)))
      c.longueurCm = nombreOuNull(longueur);
    if (nombreOuNull(largeur) !== (colis.largeurCm == null ? null : Number(colis.largeurCm)))
      c.largeurCm = nombreOuNull(largeur);
    if (nombreOuNull(hauteur) !== (colis.hauteurCm == null ? null : Number(colis.hauteurCm)))
      c.hauteurCm = nombreOuNull(hauteur);
    if (categorieChange && categorie !== 'PERSONNALISE') c.categorieTarif = categorie;
    if (categorie === 'GROS_VOLUME' && (categorieChange || Number(prixNegocie) !== prixKgInitial)) {
      c.tarifManuelParKg = Number(prixNegocie);
    }
    if (date && date !== dateInitiale) c.dateReception = new Date(date).toISOString();
    return c;
  }, [
    client,
    description,
    poids,
    longueur,
    largeur,
    hauteur,
    categorie,
    categorieChange,
    prixNegocie,
    date,
    colis,
    poidsInitial,
    prixKgInitial,
    dateInitiale,
  ]);

  const aDesChangements = Object.keys(changements).length > 0;

  // Aperçu du nouveau montant (même règle que le serveur : le prix au kilo appliqué est conservé
  // tant que la catégorie et le prix négocié ne changent pas)
  const prixKg =
    categorie === 'GROS_VOLUME' && changements.tarifManuelParKg !== undefined
      ? Number(prixNegocie) || 0
      : categorieChange
        ? (tarifDuJour ?? 0)
        : prixKgInitial;
  const montantApercu = Math.round((Number(poids) || 0) * prixKg);
  const depassePlafond = categorie === 'GROS_VOLUME' && tarifDuJour !== null && Number(prixNegocie) > tarifDuJour;

  async function enregistrer() {
    if (!aDesChangements || motif.trim().length < 3) return;
    setSaving(true);
    try {
      const updated = await modifierColis(colis.trackingId, { ...changements, motif: motif.trim() });
      notify.success('Modification enregistrée dans l’historique du colis.');
      setMotif('');
      onUpdated(updated);
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const verrou = (
    <span className="inline-flex items-center gap-1 text-[11px] font-normal text-slate-400">
      <Lock size={11} /> verrouillé
    </span>
  );

  return (
    <div className="space-y-4">
      {paye && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          Un paiement a déjà été enregistré : seules la description et la date de réception peuvent encore être
          modifiées.
        </p>
      )}

      <div>
        <p className="mb-1.5 flex items-center justify-between text-sm font-medium text-night-700 dark:text-slate-300">
          Client {clientVerrouille && verrou}
        </p>
        {clientVerrouille ? (
          <p className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-500 dark:border-night-600 dark:text-slate-400">
            {colis.client.fullName} ({colis.client.clientCode})
            {!paye && colis.facture ? ` · déjà sur la facture ${colis.facture.factureNumber}` : ''}
          </p>
        ) : (
          <ClientPicker selectedClient={client} onSelect={setClient} />
        )}
      </div>

      <Textarea label="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

      <fieldset disabled={paye} className="space-y-4 disabled:opacity-60">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Poids réel (kg)"
            type="number"
            step="0.01"
            min="0.01"
            value={poids}
            onChange={(e) => setPoids(e.target.value)}
          />
          <Select label="Catégorie" value={categorie} onChange={(e) => setCategorie(e.target.value as Categorie)}>
            <option value="STANDARD">Standard</option>
            <option value="RISQUE">Sensible / à risque</option>
            <option value="GROS_VOLUME">Gros volume</option>
            {colis.categorieTarif === 'PERSONNALISE' && <option value="PERSONNALISE">Personnalisé</option>}
          </Select>
        </div>
        {categorie === 'GROS_VOLUME' && (
          <div>
            <Input
              label="Prix négocié (GNF/kg)"
              type="number"
              min="1"
              value={prixNegocie}
              onChange={(e) => setPrixNegocie(e.target.value)}
            />
            {tarifDuJour !== null && (
              <p className={`mt-1 text-xs ${depassePlafond ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                Tarif Standard : {formatNumber(tarifDuJour)} GNF/kg
                {depassePlafond ? ' · le prix négocié ne peut pas le dépasser' : ''}
              </p>
            )}
          </div>
        )}
        <div>
          <p className="mb-1.5 text-sm font-medium text-night-700 dark:text-slate-300">Dimensions (cm)</p>
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              min="0"
              placeholder="Longueur"
              value={longueur}
              onChange={(e) => setLongueur(e.target.value)}
            />
            <Input
              type="number"
              min="0"
              placeholder="Largeur"
              value={largeur}
              onChange={(e) => setLargeur(e.target.value)}
            />
            <Input
              type="number"
              min="0"
              placeholder="Hauteur"
              value={hauteur}
              onChange={(e) => setHauteur(e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      <Input label="Date de réception" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />

      {!paye && montantApercu !== montantInitial && (
        <p className="rounded-lg bg-cargo-500/10 px-3 py-2 text-sm text-night-800 dark:text-slate-200">
          Montant : {formatNumber(montantInitial)} →{' '}
          <span className="font-semibold">{formatNumber(montantApercu)} GNF</span>
          {colis.facture ? ' (la facture et le solde du client seront ajustés)' : ''}
        </p>
      )}

      <Input
        label="Motif de la modification (obligatoire)"
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        placeholder="Ex : erreur de pesée, mauvais client sélectionné"
      />

      <Button
        variant="cargo"
        fullWidth
        loading={saving}
        disabled={!aDesChangements || motif.trim().length < 3 || depassePlafond}
        onClick={enregistrer}
      >
        {aDesChangements ? 'Enregistrer la modification' : 'Aucune modification'}
      </Button>
    </div>
  );
}
