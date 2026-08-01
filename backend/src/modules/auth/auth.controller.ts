import { Request, Response } from 'express';
import * as authService from './auth.service';
import {
  loginSchema,
  requestOtpSchema,
  verifyOtpSchema,
  refreshSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
} from './auth.schema';

function handleError(res: Response, error: unknown) {
  if (error instanceof authService.AuthError) {
    return res.status(error.statusCode).json({ success: false, data: null, error: error.message });
  }
  console.error(error);
  return res.status(500).json({ success: false, data: null, error: 'Erreur interne du serveur.' });
}

export async function loginHandler(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  try {
    const result = await authService.login(parsed.data.identifier, parsed.data.password);
    return res.status(200).json({ success: true, data: result, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function requestOtpHandler(req: Request, res: Response) {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  await authService.requestOtp(parsed.data.identifier);
  // Réponse générique dans tous les cas (anti-énumération de comptes).
  return res.status(200).json({
    success: true,
    data: { message: 'Si ce compte existe, un code a été envoyé par WhatsApp/SMS.' },
    error: null,
  });
}

export async function verifyOtpHandler(req: Request, res: Response) {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  try {
    const result = await authService.verifyOtpAndLogin(parsed.data.identifier, parsed.data.otpCode);
    return res.status(200).json({ success: true, data: result, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function refreshHandler(req: Request, res: Response) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  try {
    const result = await authService.refreshAccessToken(parsed.data.refreshToken);
    return res.status(200).json({ success: true, data: result, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function logoutHandler(req: Request, res: Response) {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  await authService.logout(parsed.data.refreshToken);
  return res.status(200).json({ success: true, data: { message: 'Déconnexion réussie.' }, error: null });
}

export async function requestPasswordResetHandler(req: Request, res: Response) {
  const parsed = resetPasswordRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  await authService.requestPasswordReset(parsed.data.identifier);
  return res.status(200).json({
    success: true,
    data: { message: 'Si ce compte existe, un code de réinitialisation a été envoyé.' },
    error: null,
  });
}

export async function confirmPasswordResetHandler(req: Request, res: Response) {
  const parsed = resetPasswordConfirmSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  try {
    await authService.confirmPasswordReset(
      parsed.data.identifier,
      parsed.data.otpCode,
      parsed.data.newPassword,
    );
    return res.status(200).json({
      success: true,
      data: { message: 'Mot de passe réinitialisé avec succès.' },
      error: null,
    });
  } catch (error) {
    return handleError(res, error);
  }
}
