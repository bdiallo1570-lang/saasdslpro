import { z } from 'zod';

export const createRateSchema = z.object({
  fromCurrency: z.enum(['USD', 'EUR', 'CNY']),
  rate: z.coerce.number().positive('Le taux doit être supérieur à 0.'),
  effectiveFrom: z.coerce.date(),
});

export type CreateRateInput = z.infer<typeof createRateSchema>;
