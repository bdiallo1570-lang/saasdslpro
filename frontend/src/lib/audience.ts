import { BeforeSendEvent, track } from '@vercel/analytics/react';
import { estZonePrivee } from './zonesPrivees';

// Mesure d'audience Vercel Analytics : sans cookie et sans identifiant personnel (rien à
// consentir, voir politique de confidentialité). Statistiques dans le tableau de bord Vercel,
// onglet « Analytics » (à activer une fois sur le projet). En local, rien n'est envoyé.
//
// Avant chaque envoi :
//  - les écrans de l'application (personnel connecté) ne sont pas comptés ;
//  - le jeton secret des liens de documents (/document/…) est masqué ;
//  - les paramètres d'adresse (?…) sont retirés.
export function filtrerEvenement(evenement: BeforeSendEvent): BeforeSendEvent | null {
  const url = new URL(evenement.url);
  if (estZonePrivee(url.pathname)) return null;
  if (url.pathname.startsWith('/document/')) url.pathname = '/document/[jeton]';
  url.search = '';
  return { ...evenement, url: url.toString() };
}

// Événement personnalisé (ex. clic sur l'appel à l'action). Comptabilisé par Vercel sur les
// formules qui incluent les événements personnalisés ; sans effet sinon.
export function suivreEvenement(nom: string, details?: Record<string, string>) {
  track(nom, details);
}
