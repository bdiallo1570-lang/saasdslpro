import { z } from 'zod';

export const openClosureSchema = z.object({
  currency: z.enum(['GNF', 'USD', 'EUR', 'CNY']),
  fondOuverture: z.coerce.number().nonnegative("Le fond d'ouverture ne peut pas être négatif."),
  date: z.coerce.date().optional(),
});

export const createTransactionSchema = z.object({
  closureId: z.string().uuid('Caisse invalide.'),
  type: z.enum(['ENTREE', 'DEPENSE']),
  category: z.string().trim().optional(),
  label: z.string().trim().min(2, 'Le libellé est requis.'),
  montant: z.coerce.number().positive('Le montant doit être supérieur à 0.'),
  currency: z.enum(['GNF', 'USD', 'EUR', 'CNY']),
  method: z.enum(['ESPECES', 'ORANGE_MONEY', 'VIREMENT']).optional(),
});

export const closeClosureSchema = z.object({
  comptagePhysique: z.coerce.number().nonnegative(),
});
