// Écrans de l'application (connexion obligatoire) : exclus de l'exploration des moteurs de
// recherche (robots.txt, vite.config.ts) et de la mesure d'audience (lib/audience.ts).
export const ZONES_PRIVEES = [
  '/dashboard/',
  '/creances',
  '/alertes',
  '/reception',
  '/lots',
  '/clients',
  '/colis',
  '/caisse',
  '/factures',
  '/devis',
  '/ecarts-poids',
  '/parametres/',
  '/portail-client',
  '/mot-de-passe-oublie',
  '/acces-refuse',
];

export const estZonePrivee = (chemin: string) => ZONES_PRIVEES.some((zone) => chemin.startsWith(zone));
