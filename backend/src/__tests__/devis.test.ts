import { describe, it, expect } from 'vitest';
import { calculerLignes, calculerTotaux, estExpire, Tarifs } from '../modules/devis/devis.calcul';

const tarifs: Tarifs = { standardGnfKg: 160000, sensibleGnfKg: 180000, maritimeUsdM3: 370, tauxUsdGnf: 8600 };

describe('Devis : calcul des lignes', () => {
  it('applique les tarifs en base aux lignes aérien et maritime, jamais un prix saisi', () => {
    const lignes = calculerLignes(
      [
        { type: 'AERIEN_STANDARD', quantite: 12.5, prixUnitaire: 1 },
        { type: 'AERIEN_SENSIBLE', quantite: 2, libelle: 'batteries' },
        { type: 'MARITIME', quantite: 1.5 },
      ],
      tarifs,
    );
    expect(lignes.map((l) => [l.prixUnitaire, l.montant])).toEqual([
      [160000, 2000000],
      [180000, 360000],
      [370 * 8600, Math.round(1.5 * 370 * 8600)],
    ]);
    expect(lignes[1].libelle).toContain('(batteries)');
    expect(lignes[2]).toMatchObject({ unite: 'm³', prixUnitaireUsd: 370 });
  });

  it('accepte une ligne libre avec son prix', () => {
    const [l] = calculerLignes([{ type: 'LIBRE', quantite: 3, libelle: 'Emballage renforcé', unite: 'carton', prixUnitaire: 25000 }], tarifs);
    expect(l).toMatchObject({ libelle: 'Emballage renforcé', unite: 'carton', montant: 75000 });
  });

  it('refuse les saisies incomplètes avec un message clair', () => {
    expect(() => calculerLignes([], tarifs)).toThrow('au moins une ligne');
    expect(() => calculerLignes([{ type: 'LIBRE', quantite: 1, prixUnitaire: 10 }], tarifs)).toThrow('désignation');
    expect(() => calculerLignes([{ type: 'LIBRE', quantite: 1, libelle: 'x' }], tarifs)).toThrow('prix unitaire');
    expect(() => calculerLignes([{ type: 'AERIEN_STANDARD', quantite: 0 }], tarifs)).toThrow('quantité');
  });

  it('applique le prix négocié d’une ligne Gros volume, plafonné au tarif Standard', () => {
    const [l] = calculerLignes([{ type: 'AERIEN_GROS_VOLUME', quantite: 250, prixUnitaire: 145000, libelle: 'client X' }], tarifs);
    expect(l).toMatchObject({ unite: 'kg', prixUnitaire: 145000, montant: 36250000 });
    expect(l.libelle).toBe('Fret aérien Chine - Guinée, tarif Gros volume (client X)');
    expect(() => calculerLignes([{ type: 'AERIEN_GROS_VOLUME', quantite: 10 }], tarifs)).toThrow('prix négocié');
    expect(() => calculerLignes([{ type: 'AERIEN_GROS_VOLUME', quantite: 10, prixUnitaire: 170000 }], tarifs)).toThrow(
      'dépasser le tarif Standard',
    );
  });

  it('bloque le maritime sans taux USD → GNF au lieu d’inventer un prix', () => {
    expect(() => calculerLignes([{ type: 'MARITIME', quantite: 1 }], { ...tarifs, tauxUsdGnf: null })).toThrow('Taux de change');
  });
});

describe('Devis : totaux et expiration', () => {
  const lignes = calculerLignes([{ type: 'AERIEN_STANDARD', quantite: 10 }], tarifs);

  it('déduit la remise du sous-total', () => {
    expect(calculerTotaux(lignes, 100000)).toEqual({ sousTotal: 1600000, remise: 100000, total: 1500000 });
  });

  it('refuse une remise supérieure au sous-total', () => {
    expect(() => calculerTotaux(lignes, 2000000)).toThrow('dépasser');
  });

  it('expire seulement un devis sans réponse dont la date est passée', () => {
    const hier = new Date(Date.now() - 86400000);
    expect(estExpire('ENVOYE', hier)).toBe(true);
    expect(estExpire('ACCEPTE', hier)).toBe(false);
    expect(estExpire('BROUILLON', new Date(Date.now() + 86400000))).toBe(false);
  });
});
