// Calcul des lignes et totaux d'un devis — pur (aucun accès à la base), donc testable. Les prix
// des lignes catalogue viennent TOUJOURS des tarifs en base (passés dans `tarifs`), jamais de la
// saisie : seul le prix d'une ligne libre est saisi. Une négociation passe par la remise.

export type DevisLigneType = 'AERIEN_STANDARD' | 'AERIEN_SENSIBLE' | 'MARITIME' | 'LIBRE';

export interface LigneSaisie {
  type: DevisLigneType;
  quantite: number;
  // Précision facultative pour les lignes catalogue (ex. « 3 cartons de chaussures »),
  // désignation obligatoire pour une ligne libre
  libelle?: string;
  // Ligne libre uniquement
  unite?: string;
  prixUnitaire?: number;
}

export interface Tarifs {
  standardGnfKg: number | null;
  sensibleGnfKg: number | null;
  maritimeUsdM3: number | null;
  // Taux USD → GNF à appliquer (figé sur le devis), null si aucun taux configuré
  tauxUsdGnf: number | null;
}

export interface LigneCalculee {
  ordre: number;
  type: DevisLigneType;
  libelle: string;
  quantite: number;
  unite: string;
  prixUnitaireUsd: number | null;
  prixUnitaire: number;
  montant: number;
}

export class DevisCalculError extends Error {}

const LIBELLES: Record<Exclude<DevisLigneType, 'LIBRE'>, string> = {
  AERIEN_STANDARD: 'Fret aérien Chine - Guinée, Cargo Standard',
  AERIEN_SENSIBLE: 'Fret aérien Chine - Guinée, Cargo Sensible',
  MARITIME: 'Fret maritime Chine - Guinée',
};

function arrondi(v: number): number {
  return Math.round(v);
}

export function calculerLignes(saisies: LigneSaisie[], tarifs: Tarifs): LigneCalculee[] {
  if (saisies.length === 0) throw new DevisCalculError('Ajoutez au moins une ligne au devis.');

  return saisies.map((l, i) => {
    const n = i + 1;
    if (!(l.quantite > 0)) throw new DevisCalculError(`Ligne ${n} : la quantité doit être supérieure à 0.`);
    const precision = l.libelle?.trim();

    if (l.type === 'AERIEN_STANDARD' || l.type === 'AERIEN_SENSIBLE') {
      const prix = l.type === 'AERIEN_STANDARD' ? tarifs.standardGnfKg : tarifs.sensibleGnfKg;
      if (!prix) throw new DevisCalculError(`Ligne ${n} : aucun tarif aérien actif pour cette catégorie.`);
      return {
        ordre: n,
        type: l.type,
        libelle: precision ? `${LIBELLES[l.type]} (${precision})` : LIBELLES[l.type],
        quantite: l.quantite,
        unite: 'kg',
        prixUnitaireUsd: null,
        prixUnitaire: prix,
        montant: arrondi(l.quantite * prix),
      };
    }

    if (l.type === 'MARITIME') {
      if (!tarifs.maritimeUsdM3) throw new DevisCalculError(`Ligne ${n} : aucun prix maritime au m³ configuré.`);
      if (!tarifs.tauxUsdGnf) {
        throw new DevisCalculError(
          `Ligne ${n} : aucun taux USD → GNF configuré. Ajoutez-le dans « Taux de change » pour chiffrer le maritime.`,
        );
      }
      const prix = arrondi(tarifs.maritimeUsdM3 * tarifs.tauxUsdGnf);
      return {
        ordre: n,
        type: l.type,
        libelle: precision ? `${LIBELLES.MARITIME} (${precision})` : LIBELLES.MARITIME,
        quantite: l.quantite,
        unite: 'm³',
        prixUnitaireUsd: tarifs.maritimeUsdM3,
        prixUnitaire: prix,
        montant: arrondi(l.quantite * prix),
      };
    }

    if (!precision) throw new DevisCalculError(`Ligne ${n} : indiquez la désignation.`);
    if (l.prixUnitaire === undefined || !(l.prixUnitaire >= 0)) {
      throw new DevisCalculError(`Ligne ${n} : indiquez un prix unitaire (0 ou plus).`);
    }
    return {
      ordre: n,
      type: 'LIBRE',
      libelle: precision,
      quantite: l.quantite,
      unite: l.unite?.trim() || 'forfait',
      prixUnitaireUsd: null,
      prixUnitaire: arrondi(l.prixUnitaire),
      montant: arrondi(l.quantite * l.prixUnitaire),
    };
  });
}

export function calculerTotaux(lignes: LigneCalculee[], remise = 0) {
  const sousTotal = lignes.reduce((s, l) => s + l.montant, 0);
  const r = arrondi(remise || 0);
  if (r < 0) throw new DevisCalculError('La remise ne peut pas être négative.');
  if (r > sousTotal) throw new DevisCalculError('La remise ne peut pas dépasser le sous-total.');
  return { sousTotal, remise: r, total: sousTotal - r };
}

// Expiré : date de validité dépassée alors que le client n'a ni accepté ni refusé
export function estExpire(status: string, validUntil: Date, now = new Date()): boolean {
  return (status === 'BROUILLON' || status === 'ENVOYE') && validUntil.getTime() < now.getTime();
}
