import { z } from 'zod';

export const updateSeuilsAlertesSchema = z.object({
  seuilCreanceGnf: z.coerce.number().positive().optional(),
  seuilMargeFaiblePourcent: z.coerce.number().positive().optional(),
  joursAvantAlerteCreance: z.coerce.number().int().positive().optional(),
});
