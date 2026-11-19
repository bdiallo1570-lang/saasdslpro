import { z } from 'zod';

// Date de réception : jamais dans le futur. Comparée à l'heure de CHAQUE requête (un .max(new
// Date()) serait figé au démarrage du serveur et refuserait toute date postérieure) ; une minute
// de tolérance couvre le décalage d'horloge entre le navigateur et le serveur.
const dateReceptionPassee = z.coerce
  .date()
  .refine((d) => d.getTime() <= Date.now() + 60_000, 'La date de réception ne peut pas être dans le futur.');

export const createColisSchema = z.object({
  clientId: z.string().uuid('Client invalide.'),
  description: z.string().trim().min(2, 'La description est requise.'),
  poidsReelKg: z.coerce.number().positive('Le poids réel doit être supérieur à 0.'),
  longueurCm: z.coerce.number().positive().optional(),
  largeurCm: z.coerce.number().positive().optional(),
  hauteurCm: z.coerce.number().positive().optional(),
  categorieTarif: z.enum(['STANDARD', 'RISQUE', 'PERSONNALISE', 'GROS_VOLUME']),
  // Prix au kilo saisi : requis pour PERSONNALISE (avec motif, Admin) et GROS_VOLUME (prix négocié)
  tarifManuelParKg: z.coerce.number().positive().optional(),
  motifTarifManuel: z.string().trim().optional(),
  photos: z.array(z.string()).optional(),
  // Date de réception réelle du colis, saisie manuellement si différente du moment de la saisie
  // informatique (ex : colis reçu la veille). Ne peut pas être dans le futur — un colis ne peut
  // pas être "reçu" avant d'avoir été physiquement reçu.
  dateReception: dateReceptionPassee.optional(),
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

// Modification des informations saisies d'un colis (Admin, Agent Chine). Champ absent = inchangé ;
// null = valeur effacée (dimensions, date de réception). Le motif est obligatoire : il est
// conservé dans l'historique du colis avec chaque valeur avant → après.
export const modifierColisSchema = z.object({
  clientId: z.string().uuid('Client invalide.').optional(),
  description: z.string().trim().min(2, 'La description est requise.').optional(),
  poidsReelKg: z.coerce.number().positive('Le poids réel doit être supérieur à 0.').optional(),
  longueurCm: z.number().positive().nullable().optional(),
  largeurCm: z.number().positive().nullable().optional(),
  hauteurCm: z.number().positive().nullable().optional(),
  categorieTarif: z.enum(['STANDARD', 'RISQUE', 'GROS_VOLUME']).optional(),
  // Prix au kilo négocié, catégorie Gros volume uniquement
  tarifManuelParKg: z.coerce.number().positive('Le prix négocié doit être supérieur à 0.').optional(),
  dateReception: z.union([z.null(), dateReceptionPassee]).optional(),
  motif: z
    .string({ required_error: 'Indiquez le motif de la modification.' })
    .trim()
    .min(3, 'Indiquez le motif de la modification (3 caractères minimum).'),
});

export type ModifierColisInput = z.infer<typeof modifierColisSchema>;
