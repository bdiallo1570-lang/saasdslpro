import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL est requis'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_ACCESS_SECRET: z.string().min(10, 'JWT_ACCESS_SECRET est requis'),
  JWT_REFRESH_SECRET: z.string().min(10, 'JWT_REFRESH_SECRET est requis'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  OTP_EXPIRES_IN_MINUTES: z.coerce.number().default(5),
  // Optionnelles — tant qu'absentes, getWhatsAppProvider() retombe sur le stub (log console).
  GREEN_API_INSTANCE_ID: z.string().optional(),
  GREEN_API_TOKEN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuration invalide (.env) :', parsed.error.flatten().fieldErrors);
  throw new Error("Échec du chargement des variables d'environnement.");
}

export const env = parsed.data;
