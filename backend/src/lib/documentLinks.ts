import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { env } from '@/config/env';

// Liens de téléchargement des factures et reçus, envoyés au client (WhatsApp, QR code du PDF).
// Le lien porte sa propre preuve : type + identifiant + date d'expiration, signés HMAC-SHA256.
// Infalsifiable sans le secret serveur, et aucune table à créer. Contrepartie : un lien ne se
// révoque pas un par un — d'où une durée de validité limitée. Changer le secret invalide tous
// les liens déjà envoyés.

export type DocumentType = 'facture' | 'recu';

const VALIDITE_JOURS = 180;

function cle(): Buffer {
  // Clé dédiée dérivée : un lien de document ne peut jamais servir de jeton de session
  const secret = env.DOCUMENT_LINK_SECRET ?? env.JWT_ACCESS_SECRET;
  return createHash('sha256').update(`documents:${secret}`).digest();
}

function signature(payload: string): string {
  return createHmac('sha256', cle()).update(payload).digest('base64url');
}

export function signDocumentToken(type: DocumentType, id: string, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + VALIDITE_JOURS * 24 * 3600;
  const payload = Buffer.from(`${type}.${id}.${exp}`).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function verifyDocumentToken(token: string, now = Date.now()): { type: DocumentType; id: string } | null {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;

  const attendue = Buffer.from(signature(payload));
  const recue = Buffer.from(sig);
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return null;

  const [type, id, exp] = Buffer.from(payload, 'base64url').toString().split('.');
  if ((type !== 'facture' && type !== 'recu') || !id || !exp) return null;
  if (Number(exp) * 1000 < now) return null;
  return { type, id };
}

// Adresse publique du site (page /document/:token qui propose le téléchargement)
export function publicSiteUrl(): string {
  const url = env.PUBLIC_SITE_URL ?? env.FRONTEND_URL.split(',')[0].trim();
  return url.replace(/\/$/, '');
}

export function documentUrl(type: DocumentType, id: string): string {
  return `${publicSiteUrl()}/document/${signDocumentToken(type, id)}`;
}
