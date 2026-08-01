import { z } from 'zod';

export const createFactureSchema = z.object({
  clientId: z.string().uuid('Client invalide.'),
  colisIds: z.array(z.string().uuid()).min(1, 'Au moins un colis doit être facturé.'),
});

export const deblocageLivraisonSchema = z.object({
  motif: z.string().trim().min(5, 'Un motif détaillé est requis pour débloquer la livraison.'),
});
