import { useCallback, useState } from 'react';
import { z } from 'zod';

// Validation des formulaires : mêmes règles et mêmes messages que le serveur (backend
// modules/*/…schema.ts), vérifiées avant l'envoi pour afficher l'erreur sous le champ concerné.
// Le serveur reste l'autorité : il refait toujours la vérification.

export type Erreurs = Record<string, string>;

export function useValidation<S extends z.ZodTypeAny>(schema: S) {
  const [erreurs, setErreurs] = useState<Erreurs>({});

  // Renvoie les données validées, ou null après avoir affiché les erreurs et placé le curseur
  // sur le premier champ invalide
  const valider = useCallback(
    (valeurs: z.input<S>): z.output<S> | null => {
      const r = schema.safeParse(valeurs);
      if (r.success) {
        setErreurs({});
        return r.data;
      }
      const e: Erreurs = {};
      for (const i of r.error.issues) {
        const cle = i.path.join('.') || '_';
        if (!e[cle]) e[cle] = i.message;
      }
      setErreurs(e);
      requestAnimationFrame(() => {
        const portee = document.querySelector('[role="dialog"]') ?? document;
        portee.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return null;
    },
    [schema],
  );

  // À appeler quand l'utilisateur modifie un champ : son erreur disparaît aussitôt
  const effacer = useCallback((...champs: string[]) => {
    setErreurs((e) => {
      if (!champs.some((c) => e[c])) return e;
      const reste = { ...e };
      for (const c of champs) delete reste[c];
      return reste;
    });
  }, []);

  return { erreurs, valider, effacer, setErreurs };
}

// ── Règles partagées ─────────────────────────────────────────────────────────────────────

const MOTS_DE_PASSE_INTERDITS = ['changemoi123!'];

// Identique à motDePasseSolide (backend auth.schema.ts)
export const motDePasseSolide = z
  .string()
  .min(10, 'Le nouveau mot de passe doit contenir au moins 10 caractères.')
  .regex(/[A-Za-z]/, 'Le nouveau mot de passe doit contenir au moins une lettre.')
  .regex(/\d/, 'Le nouveau mot de passe doit contenir au moins un chiffre.')
  .refine((v) => !MOTS_DE_PASSE_INTERDITS.includes(v.toLowerCase()), 'Ce mot de passe est public : choisissez-en un autre.');

export const identifiant = z.string().trim().min(3, 'Numéro de téléphone ou email requis.');

export const codeOtp = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Le code doit contenir 6 chiffres.');

// Numéro facultatif : s'il est saisi, il doit compter entre 8 et 15 chiffres (espaces, « + »,
// tirets et parenthèses tolérés). Évite les numéros incomplets qui bloqueraient WhatsApp.
export const telephoneFacultatif = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\+?[\d\s().-]+$/.test(v), 'Numéro invalide : chiffres, espaces et « + » uniquement.')
  .refine((v) => {
    if (v === '') return true;
    const n = v.replace(/\D/g, '').length;
    return n >= 8 && n <= 15;
  }, 'Numéro incomplet : indiquez le numéro complet avec l’indicatif (8 à 15 chiffres).');

// Nombre saisi dans un champ texte : virgule acceptée, vide = absent
const versNombre = (v: unknown) =>
  typeof v === 'string' ? (v.trim() === '' ? undefined : Number(v.replace(',', '.'))) : v;

export const nombrePositif = (message: string) =>
  z.preprocess(versNombre, z.number({ required_error: message, invalid_type_error: message }).positive(message));

// Nombre facultatif, positif s'il est renseigné
export const nombrePositifFacultatif = (message: string) =>
  z.preprocess(versNombre, z.number({ invalid_type_error: message }).positive(message).optional());

export const texteRequis = (message: string, min = 1) => z.string().trim().min(min, message);

// Nombre ≥ 0 (ex. fond de caisse, comptage physique : zéro est une valeur valable)
export const nombrePositifOuNul = (message: string) =>
  z.preprocess(versNombre, z.number({ required_error: message, invalid_type_error: message }).nonnegative(message));

// Numéro de suivi d'un colis : DSL-AAAA-NNNNN (sequence.ts côté serveur). Majuscules et espaces
// corrigés d'office : « dsl-2026-00042 » ou « DSL 2026 00042 » sont acceptés.
export const normaliserNumeroSuivi = (v: string) => v.trim().toUpperCase().replace(/\s+/g, '-');
export const numeroSuivi = z
  .string()
  .transform(normaliserNumeroSuivi)
  .refine((v) => v.length > 0, 'Saisissez le numéro de suivi du colis.')
  .refine((v) => v.length === 0 || /^DSL-\d{4}-\d{5}$/.test(v), 'Numéro de suivi invalide : il ressemble à DSL-2026-00042.');
