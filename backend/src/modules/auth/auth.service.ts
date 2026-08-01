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

export class AuthError extends Error {
  constructor(message: string, public statusCode = 401) {
    super(message);
  }
}

function findUserByIdentifier(identifier: string) {
  const isEmail = identifier.includes('@');
  return prisma.user.findFirst({
    where: {
      deletedAt: null,
      ...(isEmail ? { email: identifier } : { phoneNumber: identifier }),
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
    data: { otpCode, otpExpiresAt },
  });

  // TODO Phase ultérieure : intégration provider WhatsApp/SMS réel.
  // En attendant, le code est loggé côté serveur pour les tests en développement.
  console.info(`[OTP] Code pour ${identifier} : ${otpCode} (expire dans ${env.OTP_EXPIRES_IN_MINUTES} min)`);
}

export async function verifyOtpAndLogin(identifier: string, otpCode: string) {
  const user = await findUserByIdentifier(identifier);

  if (!user || !user.isActive || !user.otpCode || !user.otpExpiresAt) {
    throw new AuthError('Code OTP invalide ou expiré.');
  }

  if (user.otpCode !== otpCode || user.otpExpiresAt < new Date()) {
    throw new AuthError('Code OTP invalide ou expiré.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { otpCode: null, otpExpiresAt: null },
  });

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
  const user = await findUserByIdentifier(identifier);

  if (!user || !user.isActive || !user.otpCode || !user.otpExpiresAt) {
    throw new AuthError('Code OTP invalide ou expiré.');
  }

  if (user.otpCode !== otpCode || user.otpExpiresAt < new Date()) {
    throw new AuthError('Code OTP invalide ou expiré.');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, otpCode: null, otpExpiresAt: null },
  });

  // Sécurité : on révoque tous les jetons existants après un changement de mot de passe.
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
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
