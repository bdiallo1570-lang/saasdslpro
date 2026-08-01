import { z } from 'zod';

export const searchClientsSchema = z.object({
  q: z.string().trim().min(1).optional(),
});

export const createClientSchema = z.object({
  fullName: z.string().trim().min(2, 'Le nom complet est requis.'),
  phoneGn: z.string().trim().optional(),
  phoneCn: z.string().trim().optional(),
  phoneWhatsapp: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
