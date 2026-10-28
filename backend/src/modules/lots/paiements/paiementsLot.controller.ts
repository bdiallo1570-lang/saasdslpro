import { Request, Response } from 'express';
import * as paiementsLotService from './paiementsLot.service';
import * as paiementsService from '@/modules/paiements/paiements.service';
import { createPaiementColisSchema } from '@/modules/paiements/paiements.schema';
import { handleError } from '@/lib/errors';

export async function listPaiementsByLotHandler(req: Request, res: Response) {
  const paiements = await paiementsLotService.listPaiementsByLot(req.params.lotId);
  return res.status(200).json({ success: true, data: paiements, error: null });
}

export async function getPaiementsParClientHandler(req: Request, res: Response) {
  const parClient = await paiementsLotService.getPaiementsParClient(req.params.lotId);
  return res.status(200).json({ success: true, data: parClient, error: null });
}

export async function getPaiementsParLotHandler(_req: Request, res: Response) {
  const parLot = await paiementsLotService.getPaiementsParLot();
  return res.status(200).json({ success: true, data: parLot, error: null });
}

export async function createPaiementHandler(req: Request, res: Response) {
  const parsed = createPaiementColisSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  try {
    const result = await paiementsService.createPaiementForColis(
      req.params.lotId,
      parsed.data,
      req.user!.sub,
    );
    return res.status(201).json({ success: true, data: result.paiement, avertissement: result.avertissement ?? null, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}
