import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '@/config/env';

export interface AccessTokenPayload {
  sub: string; // userId
  roleName: string;
  location: string | null;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

// Le refresh token lui-même est une chaîne aléatoire opaque, pas un JWT signé.
// On stocke son hash en base (RefreshToken.tokenHash) afin de pouvoir le révoquer.
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}
