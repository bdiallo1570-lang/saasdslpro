import { z } from 'zod';
import { telephoneFacultatif, texteRequis } from '@/lib/validation';

// Fiche client : mêmes règles que le serveur (backend clients.schema.ts : nom d'au moins 2
// caractères), plus le contrôle des numéros saisis (facultatifs, mais complets s'ils le sont).
export const schemaClient = z.object({
  fullName: texteRequis('Le nom complet est requis.', 2),
  phoneGn: telephoneFacultatif,
  phoneCn: telephoneFacultatif,
  phoneWhatsapp: telephoneFacultatif,
});
