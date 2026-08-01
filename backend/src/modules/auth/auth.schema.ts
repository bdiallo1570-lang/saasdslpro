import { z } from 'zod';

// Identifiant de connexion : numéro de téléphone international OU email
export const loginSchema = z.object({
  identifier: z.string().min(3, 'Numéro de téléphone ou email requis.'),
  password: z.string().min(1, 'Mot de passe requis.'),
});

export const requestOtpSchema = z.object({
  identifier: z.string().min(3, 'Numéro de téléphone ou email requis.'),
});

export const verifyOtpSchema = z.object({
  identifier: z.string().min(3, 'Numéro de téléphone ou email requis.'),
  otpCode: z.string().length(6, 'Le code OTP doit contenir 6 chiffres.'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Jeton de rafraîchissement requis.'),
});

export const resetPasswordRequestSchema = z.object({
  identifier: z.string().min(3, 'Numéro de téléphone ou email requis.'),
});

export const resetPasswordConfirmSchema = z.object({
  identifier: z.string().min(3, 'Numéro de téléphone ou email requis.'),
  otpCode: z.string().length(6, 'Le code OTP doit contenir 6 chiffres.'),
  newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordConfirmInput = z.infer<typeof resetPasswordConfirmSchema>;
