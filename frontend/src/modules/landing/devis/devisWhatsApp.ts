import { suivreEvenement } from '@/lib/audience';

// Appel à l'action unique du site : « Demander mon devis gratuit » sur WhatsApp, au numéro de
// l'agence (le même que sur les factures, backend lib/pdf/brand.ts).
export const NUMERO_DEVIS = '224628674895';

const MESSAGE = 'Bonjour DSL Air Cargo, je souhaite un devis gratuit pour un envoi Chine → Guinée.';

// `details` : précisions ajoutées au message (ex. catégorie et poids saisis dans le calculateur)
export function lienDevisWhatsApp(details?: string): string {
  const texte = details ? `${MESSAGE}\n${details}` : MESSAGE;
  return `https://wa.me/${NUMERO_DEVIS}?text=${encodeURIComponent(texte)}`;
}

// Compte le clic dans la mesure d'audience, avec l'endroit de la page où il a eu lieu
export function noterDemandeDevis(emplacement: string) {
  suivreEvenement('Demande de devis', { emplacement });
}
