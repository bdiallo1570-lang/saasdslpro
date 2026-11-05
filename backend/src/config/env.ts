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
  // Adresse publique du site, utilisée dans les liens et QR codes des factures/reçus envoyés aux
  // clients. Par défaut : la première origine de FRONTEND_URL. Variable de confort : une valeur
  // mal saisie ne doit JAMAIS empêcher le serveur de démarrer (« www.dslcargo.com » sans https
  // l'a bloqué en production) — https:// est ajouté s'il manque, une valeur invalide est ignorée.
  PUBLIC_SITE_URL: z
    .string()
    .optional()
    .transform((raw) => {
      if (!raw?.trim()) return undefined;
      const value = /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;
      try {
        return new URL(value).origin;
      } catch {
        console.warn(`PUBLIC_SITE_URL ignorée (adresse invalide : « ${raw} »).`);
        return undefined;
      }
    }),
  // Secret des liens de documents ; par défaut dérivé de JWT_ACCESS_SECRET (voir documentLinks.ts).
  // Trop court, il est ignoré (avec un avertissement) plutôt que de bloquer le démarrage.
  DOCUMENT_LINK_SECRET: z
    .string()
    .optional()
    .transform((raw) => {
      if (!raw) return undefined;
      if (raw.length < 16) {
        console.warn('DOCUMENT_LINK_SECRET ignoré (16 caractères minimum).');
        return undefined;
      }
      return raw;
    }),
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
