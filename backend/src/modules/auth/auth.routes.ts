import { Router } from 'express';
import * as authController from './auth.controller';
import { requireAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';

export const authRouter = Router();

authRouter.post('/login', authController.loginHandler);
authRouter.post('/otp/request', authController.requestOtpHandler);
authRouter.post('/otp/verify', authController.verifyOtpHandler);
authRouter.post('/refresh', authController.refreshHandler);
authRouter.post('/logout', authController.logoutHandler);
authRouter.post('/password/reset-request', authController.requestPasswordResetHandler);
authRouter.post('/password/reset-confirm', authController.confirmPasswordResetHandler);

// Retourne le profil de l'utilisateur connecté (utile pour la redirection côté frontend au reload).
authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    include: { role: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, data: null, error: 'Utilisateur introuvable.' });
  }

  return res.status(200).json({
    success: true,
    data: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      location: user.location,
      role: user.role.roleName,
    },
    error: null,
  });
});
