import { Analytics } from '@vercel/analytics/react';
import { filtrerEvenement } from './audience';

// Script de mesure d'audience, monté une fois pour tout le site (voir audience.ts)
export function MesureAudience() {
  return <Analytics beforeSend={filtrerEvenement} />;
}
