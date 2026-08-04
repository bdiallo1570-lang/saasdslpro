import { Request, Response } from 'express';
import * as depenseLotService from './depenseLot.service';
import { createDepenseSchema, depenseFiltersSchema } from './depenseLot.schema';

function handleError(res: Response, error: unknown) {
  if (error instanceof depenseLotService.DepenseLotError) {
    return res.status(error.statusCode).json({ success: false, data: null, error: error.message });
  }
  console.error(error);
  return res.status(500).json({ success: false, data: null, error: 'Erreur interne du serveur.' });
}

export async function createDepenseHandler(req: Request, res: Response) {
  const parsed = createDepenseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  try {
    const depense = await depenseLotService.createDepense(req.params.lotId, parsed.data, req.user!.sub);
    return res.status(201).json({ success: true, data: depense, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listDepensesHandler(req: Request, res: Response) {
  const parsed = depenseFiltersSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  const [depenses, sousTotaux] = await Promise.all([
    depenseLotService.listDepensesByLot(req.params.lotId, parsed.data),
    depenseLotService.getSousTotauxParCategorie(req.params.lotId),
  ]);

  return res.status(200).json({ success: true, data: { depenses, sousTotaux }, error: null });
}

export async function updateDepenseHandler(req: Request, res: Response) {
  const parsed = createDepenseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  try {
    const depense = await depenseLotService.updateDepense(
      req.params.id,
      parsed.data,
      req.user!.sub,
      req.user!.roleName,
    );
    return res.status(200).json({ success: true, data: depense, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteDepenseHandler(req: Request, res: Response) {
  const motif = typeof req.body?.motif === 'string' ? req.body.motif.trim() : '';
  if (!motif) {
    return res.status(400).json({ success: false, data: null, error: 'Un motif est requis pour la suppression.' });
  }

  try {
    const depense = await depenseLotService.softDeleteDepense(req.params.id, req.user!.sub, motif);
    return res.status(200).json({ success: true, data: depense, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}
