import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

// Protection anti-spam des routes publiques, en complément des limites par IP de rateLimit.ts :
//  1. piège à robots (« honeypot ») sur les formulaires publics ;
//  2. limite des envois de code PAR COMPTE (numéro ou e-mail), quelle que soit l'IP : empêche
//     de bombarder un numéro de codes WhatsApp/e-mail depuis plusieurs adresses ;
//  3. limite sur les routes publiques de consultation (tarifs, calcul de prix, entrepôts) ;
//  4. plafond global par IP sur toute l'API.
// Les limites sont en mémoire : valables pour un serveur unique (cas actuel sur Render).

function refus(message: string) {
  return (_req: Request, res: Response) => res.status(429).json({ success: false, data: null, error: message });
}

// ── 1. Piège à robots ─────────────────────────────────────────────────────────────────────

// Champ caché des formulaires publics (invisible et hors navigation clavier pour un humain) :
// un robot qui remplit tous les champs le remplit aussi.
export const CHAMP_PIEGE = 'site_web';

// `fauxSucces` : pour les demandes de code, le robot reçoit la réponse habituelle (rien n'est
// envoyé) et ne peut donc pas savoir qu'il a été repéré ; sinon, refus.
export function piegeARobots(fauxSucces?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const valeur = req.body?.[CHAMP_PIEGE];
    if (typeof valeur === 'string' && valeur.trim() !== '') {
      console.warn(`[anti-spam] piège à robots déclenché sur ${req.method} ${req.originalUrl}`);
      if (fauxSucces) return res.status(200).json({ success: true, data: { message: fauxSucces }, error: null });
      return res.status(400).json({ success: false, data: null, error: 'Requête refusée.' });
    }
    if (req.body && CHAMP_PIEGE in req.body) delete req.body[CHAMP_PIEGE];
    next();
  };
}

// ── 2. Envois de code par compte ──────────────────────────────────────────────────────────

// Clé du compte visé : l'e-mail en minuscules, ou les 9 derniers chiffres d'un numéro (même
// clé pour « +224 620 71 71 50 », « 00224620717150 » ou « 620717150 »).
export function cleCompte(identifiant: unknown): string {
  const id = String(identifiant ?? '').trim().toLowerCase();
  if (!id) return '';
  if (id.includes('@')) return id;
  const chiffres = id.replace(/\D/g, '');
  return chiffres ? chiffres.slice(-9) : id;
}

export const envoiCodeParCompteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `code:${cleCompte(req.body?.identifier)}`,
  skip: (req) => !cleCompte(req.body?.identifier),
  handler: refus('Trop de codes demandés pour ce compte. Réessayez dans une heure.'),
});

// ── 3. Routes publiques de consultation ───────────────────────────────────────────────────

// Large pour les vrais visiteurs et le personnel (un bureau partage souvent une seule IP),
// bloquant pour un robot qui interroge en boucle.
export const consultationPubliqueLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: refus('Trop de requêtes. Réessayez dans quelques minutes.'),
});

// ── 4. Plafond global ─────────────────────────────────────────────────────────────────────

export const apiGlobaleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
  handler: refus('Trop de requêtes. Réessayez dans quelques minutes.'),
});
