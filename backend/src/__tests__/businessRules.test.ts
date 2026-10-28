import { describe, it, expect } from 'vitest';
import { computeVolumetricWeightKg, computeTaxableWeightKg } from '../lib/weight';
import { computePaiementColis, livraisonAutorisee } from '../modules/colis/colis.presenter';

describe('Règles métier DSL Air-Cargo (GEMINI.md)', () => {
  describe('Règle 3.1 : Calculs de Poids (réel, volumétrique, taxable)', () => {
    const DIVISEUR_PAR_DEFAUT = 6000;

    it('calcule correctement le poids volumétrique avec le diviseur 6000', () => {
      // 50cm x 40cm x 30cm = 60 000 cm³ / 6000 = 10 kg
      const vol = computeVolumetricWeightKg(50, 40, 30, DIVISEUR_PAR_DEFAUT);
      expect(vol).toBe(10);
    });

    it('calcule le poids taxable comme le maximum entre poids réel et volumétrique', () => {
      // Cas 1 : Colis léger mais volumineux (réel 4 kg, vol 10 kg -> taxable 10 kg)
      const taxableVolumineux = computeTaxableWeightKg(4, 10);
      expect(taxableVolumineux).toBe(10);

      // Cas 2 : Colis lourd et dense (réel 15 kg, vol 6 kg -> taxable 15 kg)
      const taxableDense = computeTaxableWeightKg(15, 6);
      expect(taxableDense).toBe(15);
    });

    it('permet de configurer un diviseur volumétrique personnalisé', () => {
      // Diviseur alternatif 5000 : 50x40x30 = 60000 / 5000 = 12 kg
      const volPerso = computeVolumetricWeightKg(50, 40, 30, 5000);
      expect(volPerso).toBe(12);
    });
  });

  describe('Règle 3.4 : Blocage strict de livraison', () => {
    it("bloque la livraison si le colis n'a AUCUNE facture", () => {
      expect(livraisonAutorisee(null)).toBe(false);
    });

    it('bloque la livraison si la facture est IMPAYE sans déblocage manuel', () => {
      expect(livraisonAutorisee({ status: 'IMPAYE', livraisonDebloqueeManuel: false })).toBe(false);
    });

    it('bloque la livraison si la facture est PARTIEL sans déblocage manuel', () => {
      expect(livraisonAutorisee({ status: 'PARTIEL', livraisonDebloqueeManuel: false })).toBe(false);
    });

    it('autorise la livraison si la facture est entièrement PAYE', () => {
      expect(livraisonAutorisee({ status: 'PAYE', livraisonDebloqueeManuel: false })).toBe(true);
    });

    it('autorise la livraison exceptionnelle si déblocage manuel admin actif', () => {
      expect(livraisonAutorisee({ status: 'IMPAYE', livraisonDebloqueeManuel: true })).toBe(true);
    });
  });

  describe('Règle 3.2 & 3.6 : Calculs de paiement et conversions GNF', () => {
    it('calcule correctement les soldes et statuts pour une facture GNF', () => {
      const facture = {
        id: 'fac-1',
        factureNumber: 'FAC-2026-00001',
        clientId: 'cli-1',
        montantTotal: '320000' as unknown as any,
        currency: 'GNF' as const,
        status: 'PARTIEL' as const,
        livraisonDebloqueeManuel: false,
        livraisonDeblocageMotif: null,
        livraisonDeblocageParId: null,
        livraisonDeblocageAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        paiements: [
          {
            id: 'pay-1',
            factureId: 'fac-1',
            montant: '200000' as unknown as any,
            currency: 'GNF' as const,
            tauxVersGnf: '1' as unknown as any,
            method: 'ESPECES' as const,
            cashTransactionId: null,
            receivedByUserId: null,
            createdAt: new Date(),
            deletedAt: null,
          },
        ],
      };

      const res = computePaiementColis(facture as any);
      expect(res.montantDuGnf).toBe(320000);
      expect(res.montantPayeGnf).toBe(200000);
      expect(res.resteAPayerGnf).toBe(120000);
      expect(res.tropPercuGnf).toBe(0);
      expect(res.statutPaiement).toBe('PARTIEL');
    });

    it('prend en compte le taux de change pour une facture en devise étrangère (USD)', () => {
      const TAUX_USD_GNF = 8600;
      const factureUsd = {
        id: 'fac-2',
        factureNumber: 'FAC-2026-00002',
        clientId: 'cli-2',
        montantTotal: '100' as unknown as any, // 100 USD
        currency: 'USD' as const,
        status: 'PARTIEL' as const,
        livraisonDebloqueeManuel: false,
        livraisonDeblocageMotif: null,
        livraisonDeblocageParId: null,
        livraisonDeblocageAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        paiements: [
          {
            id: 'pay-2',
            factureId: 'fac-2',
            montant: '50' as unknown as any, // 50 USD payés
            currency: 'USD' as const,
            tauxVersGnf: String(TAUX_USD_GNF) as unknown as any,
            method: 'VIREMENT' as const,
            cashTransactionId: null,
            receivedByUserId: null,
            createdAt: new Date(),
            deletedAt: null,
          },
        ],
      };

      const res = computePaiementColis(factureUsd as any);
      expect(res.montantDuGnf).toBe(100 * TAUX_USD_GNF); // 860 000 GNF
      expect(res.montantPayeGnf).toBe(50 * TAUX_USD_GNF); // 430 000 GNF
      expect(res.resteAPayerGnf).toBe(430000);
      expect(res.statutPaiement).toBe('PARTIEL');
    });
  });
});
