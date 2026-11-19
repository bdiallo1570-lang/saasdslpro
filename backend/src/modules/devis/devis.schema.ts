import { z } from 'zod';

const ligneSchema = z.object({
  type: z.enum(['AERIEN_STANDARD', 'AERIEN_SENSIBLE', 'AERIEN_GROS_VOLUME', 'MARITIME', 'LIBRE']),
  quantite: z.coerce.number().positive('La quantité doit être supérieure à 0.'),
  libelle: z.string().trim().max(200).optional(),
  unite: z.string().trim().max(20).optional(),
  prixUnitaire: z.coerce.number().min(0).optional(),
});

export const devisSchema = z.object({
  clientId: z.string().uuid('Client invalide.'),
  // Date de fin de validité ; 15 jours par défaut (voir devis.service.ts)
  validUntil: z.coerce.date().optional(),
  remise: z.coerce.number().min(0, 'La remise ne peut pas être négative.').default(0),
  note: z.string().trim().max(1000).optional(),
  lignes: z.array(ligneSchema).min(1, 'Ajoutez au moins une ligne au devis.').max(50),
});

export const statutSchema = z.object({
  status: z.enum(['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE']),
});

export type DevisInput = z.infer<typeof devisSchema>;
