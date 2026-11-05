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

// Mots de passe connus publiquement (comptes de démonstration du README) : jamais acceptés
const MOTS_DE_PASSE_INTERDITS = ['changemoi123!'];

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis.'),
    newPassword: z
      .string()
      .min(10, 'Le nouveau mot de passe doit contenir au moins 10 caractères.')
      .regex(/[A-Za-z]/, 'Le nouveau mot de passe doit contenir au moins une lettre.')
      .regex(/\d/, 'Le nouveau mot de passe doit contenir au moins un chiffre.')
      .refine((v) => !MOTS_DE_PASSE_INTERDITS.includes(v.toLowerCase()), 'Ce mot de passe est public : choisissez-en un autre.'),
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "Le nouveau mot de passe doit être différent de l'actuel.",
    path: ['newPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordConfirmInput = z.infer<typeof resetPasswordConfirmSchema>;
