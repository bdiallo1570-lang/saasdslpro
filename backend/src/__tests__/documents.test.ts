import { describe, it, expect } from 'vitest';
import { nombreEnLettres, montantEnLettres } from '../lib/montantEnLettres';
import { signDocumentToken, verifyDocumentToken } from '../lib/documentLinks';
import { regleAvant } from '../lib/pdf/paymentReceipt';
import { normalizePhone } from '../modules/auth/auth.service';
import { changePasswordSchema } from '../modules/auth/auth.schema';
import type { Paiement } from '@prisma/client';

describe('Montant en toutes lettres (reçus)', () => {
  it.each([
    [0, 'zéro'],
    [1, 'un'],
    [17, 'dix-sept'],
    [21, 'vingt et un'],
    [71, 'soixante et onze'],
    [77, 'soixante-dix-sept'],
    [80, 'quatre-vingts'],
    [81, 'quatre-vingt-un'],
    [91, 'quatre-vingt-onze'],
    [100, 'cent'],
    [200, 'deux cents'],
    [201, 'deux cent un'],
    [1000, 'mille'],
    [80000, 'quatre-vingt mille'],
    [200000, 'deux cent mille'],
    [480000, 'quatre cent quatre-vingt mille'],
    [1600000, 'un million six cent mille'],
    [200000000, 'deux cents millions'],
    [2000000000, 'deux milliards'],
  ])('%i → %s', (n, attendu) => {
    expect(nombreEnLettres(n)).toBe(attendu);
  });

  it('accorde la devise et ajoute « de » après un million rond', () => {
    expect(montantEnLettres(480000)).toBe('Quatre cent quatre-vingt mille francs guinéens');
    expect(montantEnLettres(1000000)).toBe('Un million de francs guinéens');
    expect(montantEnLettres(1)).toBe('Un franc guinéen');
    expect(montantEnLettres(250, 'USD')).toBe('Deux cent cinquante dollars américains');
  });
});

describe('Liens de documents signés', () => {
  const id = 'c56764dc-4c5e-4b12-99fc-c0a039f94eed';

  it("accepte un lien valide et rend le type et l'identifiant", () => {
    const token = signDocumentToken('recu', id);
    expect(verifyDocumentToken(token)).toEqual({ type: 'recu', id });
  });

  it('refuse un lien modifié (autre document)', () => {
    const token = signDocumentToken('facture', id);
    const [, sig] = token.split('.');
    const autre = Buffer.from(`facture.autre-id.${Math.floor(Date.now() / 1000) + 1000}`).toString('base64url');
    expect(verifyDocumentToken(`${autre}.${sig}`)).toBeNull();
    expect(verifyDocumentToken(`${token}x`)).toBeNull();
    expect(verifyDocumentToken('n-importe-quoi')).toBeNull();
  });

  it('refuse un lien expiré (au-delà de 180 jours)', () => {
    const emis = Date.now() - 181 * 24 * 3600 * 1000;
    expect(verifyDocumentToken(signDocumentToken('facture', id, emis))).toBeNull();
  });
});

describe('Reçu : situation de la facture au moment du paiement', () => {
  const p = (id: string, montant: number, jour: number, taux = 1) =>
    ({ id, montant, tauxVersGnf: taux, createdAt: new Date(2026, 9, jour) }) as unknown as Paiement;
  const paiements = [p('a', 480000, 1), p('b', 320000, 2), p('c', 50, 3, 8600), p('d', 320000, 4)];

  it("ne compte que les paiements antérieurs (le premier versement n'a rien avant lui)", () => {
    expect(regleAvant(paiements[0], paiements)).toBe(0);
    expect(regleAvant(paiements[1], paiements)).toBe(480000);
  });

  it('convertit les paiements en devise au taux figé du paiement', () => {
    expect(regleAvant(paiements[3], paiements)).toBe(480000 + 320000 + 50 * 8600);
  });

  it("l'ordre de la liste reçue n'a pas d'importance", () => {
    expect(regleAvant(paiements[3], [...paiements].reverse())).toBe(1230000);
  });
});

describe('Connexion : numéro saisi librement', () => {
  it.each([
    ['+224622222222', '+224622222222'],
    ['+224 622 22 22 22', '+224622222222'],
    ['00224622222222', '+224622222222'],
    ['622-22-22-22', '+224622222222'],
    ['622222222', '+224622222222'],
    ['+86 138 0000 0002', '+8613800000002'],
  ])('%s → %s', (saisi, attendu) => {
    expect(normalizePhone(saisi)).toBe(attendu);
  });
});

describe('Changement de mot de passe : règles', () => {
  const essai = (currentPassword: string, newPassword: string) =>
    changePasswordSchema.safeParse({ currentPassword, newPassword }).success;

  it('accepte un mot de passe solide', () => {
    expect(essai('ancien', 'Caisse2026Test')).toBe(true);
  });

  it('refuse un mot de passe trop court, sans chiffre ou sans lettre', () => {
    expect(essai('ancien', 'Court1')).toBe(false);
    expect(essai('ancien', 'SansAucunChiffre')).toBe(false);
    expect(essai('ancien', '12345678901')).toBe(false);
  });

  it('refuse le mot de passe public des comptes de démonstration, quelle que soit la casse', () => {
    expect(essai('ancien', 'ChangeMoi123!')).toBe(false);
    expect(essai('ancien', 'changemoi123!')).toBe(false);
  });

  it("refuse un nouveau mot de passe identique à l'actuel", () => {
    expect(essai('Caisse2026Test', 'Caisse2026Test')).toBe(false);
  });
});
