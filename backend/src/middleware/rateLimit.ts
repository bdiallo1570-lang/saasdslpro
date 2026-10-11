import rateLimit from 'express-rate-limit';

function jsonRateLimitResponse(message: string) {
  return (_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) => {
    res.status(429).json({ success: false, data: null, error: message });
  };
}

// OTP à 6 chiffres (~900 000 combinaisons), valide 5 minutes (OTP_EXPIRES_IN_MINUTES) — sans
// limite, brute-forçable dans sa fenêtre de validité. 10 tentatives/15 min par IP+identifiant
// laisse largement de la marge pour un vrai utilisateur qui se trompe, tout en rendant le
// brute-force impraticable.
export const otpVerifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
  handler: jsonRateLimitResponse('Trop de tentatives. Réessayez dans quelques minutes.'),
});

// Connexion par mot de passe — 10 tentatives/15 min par IP, pour freiner le brute-force sans
// bloquer un utilisateur qui enchaîne quelques essais légitimes (clavier, mauvais champ...).
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.' },
  handler: jsonRateLimitResponse('Trop de tentatives de connexion. Réessayez dans quelques minutes.'),
});

// Demande d'OTP / réinitialisation de mot de passe — déclenche un envoi WhatsApp/SMS réel à
// terme ; limite plus large (évite le spam/l'épuisement du quota du provider) sans gêner un
// usage normal.
export const otpRequestRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Trop de demandes. Réessayez dans quelques minutes.' },
  handler: jsonRateLimitResponse('Trop de demandes. Réessayez dans quelques minutes.'),
});

// Rafraîchissement de token — plus souple (déclenché automatiquement par le frontend), limite
// surtout pour éviter un abus en cas de bug client ou de script malveillant.
export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
  handler: jsonRateLimitResponse('Trop de requêtes. Réessayez dans quelques minutes.'),
});
