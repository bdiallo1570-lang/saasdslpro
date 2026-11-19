import { Colis, dateReceptionEffective } from './colis.api';

// Classement des colis par mois de réception effective (date saisie à la réception, sinon date
// d'enregistrement), dans le fuseau horaire du navigateur.

export interface MoisColis {
  // « AAAA-MM », sert de valeur au sélecteur de mois
  cle: string;
  // « Novembre 2026 »
  libelle: string;
  colis: Colis[];
  poidsKg: number;
  // Un total par devise (les colis sont normalement tous en GNF)
  montants: { currency: string; total: number }[];
}

export function cleMois(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function libelleMois(cle: string): string {
  const [annee, mois] = cle.split('-').map(Number);
  const texte = new Date(annee, mois - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

// Regroupe par mois, du plus récent au plus ancien ; l'ordre des colis dans chaque mois est
// celui de la liste reçue.
export function grouperParMois(colis: Colis[]): MoisColis[] {
  const groupes = new Map<string, Colis[]>();
  for (const c of colis) {
    const cle = cleMois(dateReceptionEffective(c));
    const liste = groupes.get(cle);
    if (liste) liste.push(c);
    else groupes.set(cle, [c]);
  }

  return [...groupes.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([cle, liste]) => {
      const montants = new Map<string, number>();
      for (const c of liste) {
        if (c.montantEstime === undefined) continue;
        const devise = c.currency ?? 'GNF';
        montants.set(devise, (montants.get(devise) ?? 0) + Number(c.montantEstime));
      }
      return {
        cle,
        libelle: libelleMois(cle),
        colis: liste,
        poidsKg: liste.reduce((s, c) => s + Number(c.poidsReelKg || 0), 0),
        montants: [...montants.entries()].map(([currency, total]) => ({
          currency,
          total,
        })),
      };
    });
}
