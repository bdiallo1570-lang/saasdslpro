import { z } from 'zod';

export const createPaiementSchema = z.object({
  factureId: z.string().uuid('Facture invalide.'),
  montant: z.coerce.number().positive('Le montant doit être supérieur à 0.'),
  currency: z.enum(['GNF', 'USD', 'EUR', 'CNY']),
  method: z.enum(['ESPECES', 'ORANGE_MONEY', 'VIREMENT']),
  // Rattache le paiement à la caisse du jour ouverte pour cette devise (entrée automatique)
  closureId: z.string().uuid().optional(),
});
