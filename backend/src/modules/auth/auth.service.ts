import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  generateOtpCode,
} from '@/lib/jwt';
import { env } from '@/config/env';
import { ROLE_DASHBOARD_ROUTE, RoleName } from '@/config/roles';
import { getWhatsAppProvider } from '@/lib/whatsapp/provider';
import { AppError } from '@/lib/errors';

export class AuthError extends AppError {
  constructor(message: string, statusCode = 401) {
    super(message, statusCode);
  }
}

// « +224 622 22 22 22 », « 00224622222222 », « 622-22-22-22 » → « +224622222222 » (format stocké).
// Un numéro guinéen à 9 chiffres sans indicatif reçoit +224 : c'est l'usage des clients.
export function normalizePhone(raw: string): string {
  let n = raw.trim().replace(/[\s.\-()]/g, '');
  if (n.startsWith('00')) n = `+${n.slice(2)}`;
  if (/^6\d{8}$/.test(n)) n = `+224${n}`;
  return n;
}

function findUserByIdentifier(identifier: string) {
  const isEmail = identifier.includes('@');
  const phones = [...new Set([identifier.trim(), normalizePhone(identifier)])];
  return prisma.user.findFirst({
    where: {
      deletedAt: null,
      ...(isEmail ? { email: identifier.trim() } : { phoneNumber: { in: phones } }),
    },
    include: { role: true },
  });
}

async function issueTokenPair(userId: string, roleName: string, location: string | null) {
  const accessToken = signAccessToken({ sub: userId, roleName, location });
  const refreshToken = generateRefreshToken();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // aligné sur JWT_REFRESH_EXPIRES_IN par défaut (30j)

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

export async function login(identifier: string, password: string) {
  const user = await findUserByIdentifier(identifier);

  if (!user || !user.isActive) {
    throw new AuthError('Identifiants invalides.');
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    throw new AuthError('Identifiants invalides.');
  }

  const tokens = await issueTokenPair(user.id, user.role.roleName, user.location);
  const redirectTo = ROLE_DASHBOARD_ROUTE[user.role.roleName as RoleName] ?? '/';

  return {
    ...tokens,
    user: toSafeUser(user),
    redirectTo,
  };
}

export async function requestOtp(identifier: string) {
  const user = await findUserByIdentifier(identifier);
  if (!user || !user.isActive) {
    // On ne révèle pas si l'utilisateur existe (énumération) — message générique.
    return;
  }

  const otpCode = generateOtpCode();
  const otpExpiresAt = new Date();
  otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + env.OTP_EXPIRES_IN_MINUTES);

  await prisma.user.update({
    where: { id: user.id },
    // Stocké haché (comme les refresh tokens) : une lecture de la base ne livre pas le code.
    data: { otpCode: hashToken(otpCode), otpExpiresAt, otpAttempts: 0 },
  });

  const message =
    `Votre code de connexion DSL Air Cargo : ${otpCode} ` +
    `(valable ${env.OTP_EXPIRES_IN_MINUTES} min). Ne le partagez avec personne.`;
  const hasRealProvider = !!(env.GREEN_API_INSTANCE_ID && env.GREEN_API_TOKEN);
  await getWhatsAppProvider().send({ toPhoneNumber: user.phoneNumber, message });

  // Sans provider WhatsApp réel configuré, le message ci-dessus n'est jamais réellement
  // délivré (le stub se contente de logguer un message générique, voir stubProvider.ts) — on
  // n'affiche le code lui-même qu'en développement, jamais en production, pour ne pas le faire
  // fuiter dans des logs potentiellement accessibles à plus de monde que prévu.
  if (!hasRealProvider && env.NODE_ENV === 'development') {
    console.info(`[OTP][dev uniquement] Code pour ${identifier} : ${otpCode} (aucun provider WhatsApp configuré)`);
  }
}

// Au-delà, le code en cours est inutilisable : il faut en redemander un. La limite par IP
// (rateLimit.ts) ne suffit pas seule — un attaquant disposant de plusieurs IP la contourne.
const MAX_OTP_ATTEMPTS = 5;

// Vérifie le code OTP d'un compte et le consomme en cas de succès. La tentative est
// comptabilisée AVANT la comparaison, par une mise à jour conditionnelle atomique : même des
// essais envoyés en rafale et en parallèle ne dépassent jamais MAX_OTP_ATTEMPTS par code.
async function consumeOtp(identifier: string, otpCode: string) {
  const user = await findUserByIdentifier(identifier);

  if (!user || !user.isActive || !user.otpCode || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    throw new AuthError('Code OTP invalide ou expiré.');
  }

  const { count } = await prisma.user.updateMany({
    where: { id: user.id, otpCode: user.otpCode, otpAttempts: { lt: MAX_OTP_ATTEMPTS } },
    data: { otpAttempts: { increment: 1 } },
  });
  if (count === 0) {
    throw new AuthError('Trop de tentatives sur ce code. Demandez un nouveau code.', 429);
  }

  if (user.otpCode !== hashToken(otpCode)) {
    throw new AuthError('Code OTP invalide ou expiré.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { otpCode: null, otpExpiresAt: null, otpAttempts: 0 },
  });

  return user;
}

export async function verifyOtpAndLogin(identifier: string, otpCode: string) {
  const user = await consumeOtp(identifier, otpCode);

  const tokens = await issueTokenPair(user.id, user.role.roleName, user.location);
  const redirectTo = ROLE_DASHBOARD_ROUTE[user.role.roleName as RoleName] ?? '/';

  return {
    ...tokens,
    user: toSafeUser(user),
    redirectTo,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { role: true } } },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date() || !stored.user.isActive) {
    throw new AuthError('Jeton de rafraîchissement invalide.');
  }

  // Rotation : on révoque l'ancien jeton et on en émet un nouveau.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokenPair(stored.user.id, stored.user.role.roleName, stored.user.location);

  return { ...tokens, user: toSafeUser(stored.user) };
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function requestPasswordReset(identifier: string) {
  return requestOtp(identifier);
}

export async function confirmPasswordReset(identifier: string, otpCode: string, newPassword: string) {
  const user = await consumeOtp(identifier, otpCode);
  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Sécurité : on révoque tous les jetons existants après un changement de mot de passe.
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// Changement de mot de passe par l'utilisateur connecté (ancien mot de passe exigé). Toutes les
// sessions sont fermées — y compris sur un autre appareil qui connaîtrait l'ancien mot de passe —
// puis une nouvelle session est ouverte pour l'appareil courant.
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, include: { role: true } });
  if (!user || !user.isActive) throw new AuthError('Compte introuvable.');

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new AuthError('Mot de passe actuel incorrect.', 400);
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } }),
    prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);

  return issueTokenPair(user.id, user.role.roleName, user.location);
}

function toSafeUser(user: {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string;
  location: string | null;
  role: { roleName: string };
}) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    location: user.location,
    role: user.role.roleName,
  };
}
