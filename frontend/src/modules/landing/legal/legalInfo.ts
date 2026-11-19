import { ReactNode } from 'react';

// Coordonnées affichées dans les pages légales : identiques à celles des factures
// (backend lib/pdf/brand.ts), à modifier aux deux endroits.
export const WHATSAPP = '+224 628 67 48 95';
export const WHATSAPP_LIEN = 'https://wa.me/224628674895';
export const ADRESSE =
  'Centre Sidy, 2e étage, boutique C6, Madina (gare voitures Liberia, en face du Centre Ariboyah), Conakry';

export interface LegalSection {
  id: string;
  titre: string;
  contenu: ReactNode;
}
