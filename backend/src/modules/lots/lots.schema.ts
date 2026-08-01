import { z } from 'zod';

export const createLotSchema = z.object({
  flightNumber: z.string().trim().optional(),
});

export const updateLotFlightSchema = z.object({
  flightNumber: z.string().trim().min(1, 'Le numéro de vol est requis.'),
  departureDate: z.coerce.date({ required_error: "La date d'embarquement est requise." }),
  // Durée de transit standard Guangzhou → Conakry, configurable au besoin.
  transitDurationHours: z.coerce.number().positive().default(30),
});

export const assignColisToLotSchema = z.object({
  colisIds: z.array(z.string().uuid()).min(1, 'Au moins un colis doit être sélectionné.'),
});

export const updateLotStatusSchema = z.object({
  status: z.enum([
    'EN_RECEPTION',
    'FERME',
    'ENVOLE',
    'ARRIVE',
    'EN_DEDOUANEMENT',
    'EN_ENTREPOT',
    'CLOTURE',
  ]),
});
