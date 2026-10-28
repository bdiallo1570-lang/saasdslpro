import { z } from 'zod';
import { gnfOnly } from '@/lib/currency';

export const createPaiementSchema = z.object({
  factureId: z.string().uuid('Facture invalide.'),
  montant: z.coerce.number().positive('Le montant doit être supérieur à 0.'),
  currency: gnfOnly,
  method: z.enum(['ESPECES', 'ORANGE_MONEY', 'MTN_MOMO', 'VIREMENT', 'AUTRE']),
  // Rattache le paiement à la caisse du jour ouverte pour cette devise (entrée automatique)
  closureId: z.string().uuid().optional(),
});

// Paiement colis-par-colis (module Agent Guinée) — colisId au lieu de factureId : le service
// résout/crée la facture mono-colis automatiquement (ensureFactureForColis) si nécessaire.
export const createPaiementColisSchema = z.object({
  colisId: z.string().uuid('Colis invalide.'),
  montant: z.coerce.number().positive('Le montant doit être supérieur à 0.'),
  currency: gnfOnly,
  method: z.enum(['ESPECES', 'ORANGE_MONEY', 'MTN_MOMO', 'VIREMENT', 'AUTRE']),
  reference: z.string().trim().optional(),
  datePaiement: z.coerce.date().optional(),
  commentaire: z.string().trim().optional(),
});
