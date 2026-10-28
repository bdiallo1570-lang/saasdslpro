import { z } from 'zod';
import { gnfOnly } from '@/lib/currency';

const CATEGORIES = [
  'DEDOUANEMENT',
  'TRANSPORT_AEROPORT_MADINA',
  'MANUTENTION',
  'STOCKAGE',
  'DOCUMENTATION',
  'DIVERS',
] as const;

export const createDepenseSchema = z
  .object({
    categorie: z.enum(CATEGORIES),
    libelle: z.string().trim().min(2, 'Le libellé est requis.'),
    montant: z.coerce.number().positive('Le montant doit être supérieur à 0.'),
    currency: gnfOnly.default('GNF'),
    // Requis uniquement si devise ≠ GNF — le backend calcule montantGnf, jamais le frontend.
    tauxVersGnf: z.coerce.number().positive().optional(),
    dateDepense: z.coerce.date(),
    beneficiaire: z.string().trim().optional(),
    referenceRecu: z.string().trim().optional(),
    justificatifUrl: z.string().trim().optional(),
  })
  .refine((data) => data.currency === 'GNF' || data.tauxVersGnf !== undefined, {
    message: 'Le taux de change est requis pour une devise différente de GNF.',
    path: ['tauxVersGnf'],
  });

export type CreateDepenseInput = z.infer<typeof createDepenseSchema>;

export const updateDepenseSchema = createDepenseSchema;

export const depenseFiltersSchema = z.object({
  categorie: z.enum(CATEGORIES).optional(),
  dateDebut: z.coerce.date().optional(),
  dateFin: z.coerce.date().optional(),
});
