import { z } from 'zod';

export const createColisSchema = z.object({
  clientId: z.string().uuid('Client invalide.'),
  description: z.string().trim().min(2, 'La description est requise.'),
  poidsReelKg: z.coerce.number().positive('Le poids réel doit être supérieur à 0.'),
  longueurCm: z.coerce.number().positive().optional(),
  largeurCm: z.coerce.number().positive().optional(),
  hauteurCm: z.coerce.number().positive().optional(),
  categorieTarif: z.enum(['STANDARD', 'RISQUE', 'PERSONNALISE']),
  // Requis uniquement pour la catégorie PERSONNALISE (tarif manuel, tracé à l'audit)
  tarifManuelParKg: z.coerce.number().positive().optional(),
  motifTarifManuel: z.string().trim().optional(),
  photos: z.array(z.string()).optional(),
  // Date de réception réelle du colis, saisie manuellement si différente du moment de la saisie
  // informatique (ex : colis reçu la veille). Ne peut pas être dans le futur — un colis ne peut
  // pas être "reçu" avant d'avoir été physiquement reçu.
  dateReception: z.coerce
    .date()
    .max(new Date(), 'La date de réception ne peut pas être dans le futur.')
    .optional(),
});

export type CreateColisInput = z.infer<typeof createColisSchema>;

export const priceSimulationSchema = z.object({
  categorieTarif: z.enum(['STANDARD', 'RISQUE']),
  poidsKg: z.coerce.number().positive('Le poids doit être supérieur à 0.'),
});

export const reportWeightDiscrepancySchema = z.object({
  poidsGuineeKg: z.coerce.number().positive('Le poids constaté doit être supérieur à 0.'),
});

export const resolveDiscrepancySchema = z.object({
  resolutionNote: z.string().trim().optional(),
});

export const updateColisStatusSchema = z.object({
  status: z.enum([
    'ENREGISTRE',
    'ASSIGNE_LOT',
    'ENVOLE',
    'ARRIVE',
    'EN_DEDOUANEMENT',
    'DISPONIBLE_ENTREPOT',
  ]),
});

export const updateColisPriceSchema = z.object({
  montantEstime: z.coerce.number().positive('Le montant doit être supérieur à 0.'),
  motif: z.string().trim().min(3, 'Un motif est requis pour justifier la modification du prix.'),
});
