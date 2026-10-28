import { Response } from 'express';

// Erreur métier attendue (ressource introuvable, règle violée...) : renvoyée telle quelle au
// client avec son code HTTP. Chaque module en dérive sa propre classe (FactureError, ...).
export class AppError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

export function handleError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, data: null, error: error.message });
  }
  console.error(error);
  return res.status(500).json({ success: false, data: null, error: 'Erreur interne du serveur.' });
}
