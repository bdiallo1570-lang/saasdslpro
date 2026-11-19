import { describe, it, expect } from 'vitest';
import { comparer, CHAMPS_PRIX } from '../modules/colis/colis.modification';

describe('Modification de colis : empreinte avant → après', () => {
  it('ne garde que les champs réellement modifiés, avec leur libellé', () => {
    const changements = comparer(
      { description: '3 cartons', poidsReelKg: 12, longueurCm: null, dateReception: null },
      { description: '3 cartons', poidsReelKg: 14.5, longueurCm: 40, dateReception: '2026-11-18T09:00:00.000Z' },
    );
    expect(changements).toEqual([
      { champ: 'poidsReelKg', libelle: 'Poids réel (kg)', avant: 12, apres: 14.5 },
      { champ: 'longueurCm', libelle: 'Longueur (cm)', avant: null, apres: 40 },
      { champ: 'dateReception', libelle: 'Date de réception', avant: null, apres: '2026-11-18T09:00:00.000Z' },
    ]);
  });

  it('ne signale rien quand rien ne change', () => {
    expect(comparer({ description: 'a', poidsReelKg: 1 }, { description: 'a', poidsReelKg: 1 })).toEqual([]);
  });

  it('classe description et date parmi les seuls champs modifiables après un paiement', () => {
    expect(CHAMPS_PRIX).not.toContain('description');
    expect(CHAMPS_PRIX).not.toContain('dateReception');
    expect(CHAMPS_PRIX).toEqual(expect.arrayContaining(['client', 'poidsReelKg', 'categorieTarif', 'prixKg', 'montantEstime']));
  });
});
