import { Request, Response } from 'express';
import * as facturesService from './factures.service';
import { createFactureSchema, deblocageLivraisonSchema } from './factures.schema';

function handleError(res: Response, error: unknown) {
  if (error instanceof facturesService.FactureError) {
    return res.status(error.statusCode).json({ success: false, data: null, error: error.message });
  }
  console.error(error);
  return res.status(500).json({ success: false, data: null, error: 'Erreur interne du serveur.' });
}

export async function createFactureHandler(req: Request, res: Response) {
  const parsed = createFactureSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }
  try {
    const facture = await facturesService.createFacture(parsed.data.clientId, parsed.data.colisIds);
    return res.status(201).json({ success: true, data: facture, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getFactureHandler(req: Request, res: Response) {
  const facture = await facturesService.getFactureById(req.params.id);
  if (!facture) {
    return res.status(404).json({ success: false, data: null, error: 'Facture introuvable.' });
  }
  return res.status(200).json({ success: true, data: facture, error: null });
}

export async function listFacturesByClientHandler(req: Request, res: Response) {
  const factures = await facturesService.listFacturesByClient(req.params.clientId);
  return res.status(200).json({ success: true, data: factures, error: null });
}

export async function listUnbilledColisHandler(req: Request, res: Response) {
  const colis = await facturesService.listUnbilledColisForClient(req.params.clientId);
  return res.status(200).json({ success: true, data: colis, error: null });
}

export async function debloquerLivraisonHandler(req: Request, res: Response) {
  const parsed = deblocageLivraisonSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }
  try {
    const facture = await facturesService.debloquerLivraison(
      req.params.id,
      req.user!.sub,
      parsed.data.motif,
    );
    return res.status(200).json({ success: true, data: facture, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}
