import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/asyncHandler';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, data: null, error: 'Authentification requise.' });
  }

  try {
    const token = header.slice('Bearer '.length);
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ success: false, data: null, error: 'Session invalide ou expirée.' });
  }
}

// Vérifie que l'utilisateur possède l'un des rôles autorisés.
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.roleName)) {
      return res
        .status(403)
        .json({ success: false, data: null, error: "Accès refusé : rôle insuffisant." });
    }
    next();
  };
}

// Vérifie une permission granulaire issue de Role.permissionsJson.
// Utilisé notamment pour restreindre les vues financières / marges bénéficiaires à l'Admin.
export function requirePermission(permissionKey: string) {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, data: null, error: 'Authentification requise.' });
    }

    const role = await prisma.role.findUnique({ where: { roleName: req.user.roleName } });
    const permissions = (role?.permissionsJson as Record<string, boolean>) ?? {};

    if (!permissions[permissionKey]) {
      return res
        .status(403)
        .json({ success: false, data: null, error: 'Accès refusé : permission manquante.' });
    }
    next();
  });
}
