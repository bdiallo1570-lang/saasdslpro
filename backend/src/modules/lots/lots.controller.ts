import { Request, Response } from 'express';
import * as lotsService from './lots.service';
import {
  createLotSchema,
  updateLotFlightSchema,
  assignColisToLotSchema,
  updateLotStatusSchema,
} from './lots.schema';
import { presentColis, canReadPricing } from '@/modules/colis/colis.presenter';

function handleError(res: Response, error: unknown) {
  if (error instanceof lotsService.LotError) {
    return res.status(error.statusCode).json({ success: false, data: null, error: error.message });
  }
  console.error(error);
  return res.status(500).json({ success: false, data: null, error: 'Erreur interne du serveur.' });
}

// Le détail de lot embarque les colis (avec client) — l'Agent Chine a lots:read mais ne
// doit pas voir les montants ; on remappe les colis imbriqués via le presenter colis, et
// on retire le taux de change figé (donnée financière, Phase 3) pour les rôles sans pricing.
function presentLot<T extends { colis: unknown[]; tauxVersGnfFige?: unknown }>(lot: T, roleName: string) {
  const colis = lot.colis.map((c) => presentColis(c as Parameters<typeof presentColis>[0], roleName));
  if (canReadPricing(roleName)) {
    return { ...lot, colis };
  }
  const { tauxVersGnfFige, tauxDeviseOrigine, ...rest } = lot as Record<string, unknown>;
  return { ...rest, colis };
}

export async function createLotHandler(req: Request, res: Response) {
  const parsed = createLotSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }
  const lot = await lotsService.createLot(parsed.data.flightNumber);
  return res.status(201).json({ success: true, data: lot, error: null });
}

export async function listLotsHandler(_req: Request, res: Response) {
  const lots = await lotsService.listLots();
  return res.status(200).json({ success: true, data: lots, error: null });
}

export async function getLotHandler(req: Request, res: Response) {
  const lot = await lotsService.getLotById(req.params.id);
  if (!lot) {
    return res.status(404).json({ success: false, data: null, error: 'Lot introuvable.' });
  }
  return res.status(200).json({ success: true, data: presentLot(lot, req.user!.roleName), error: null });
}

export async function assignColisHandler(req: Request, res: Response) {
  const parsed = assignColisToLotSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }
  try {
    const lot = await lotsService.assignColisToLot(req.params.id, parsed.data.colisIds);
    if (!lot) {
      return res.status(404).json({ success: false, data: null, error: 'Lot introuvable.' });
    }
    return res.status(200).json({ success: true, data: presentLot(lot, req.user!.roleName), error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function setFlightInfoHandler(req: Request, res: Response) {
  const parsed = updateLotFlightSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }
  try {
    const lot = await lotsService.setLotFlightInfo(
      req.params.id,
      parsed.data.flightNumber,
      parsed.data.departureDate,
      parsed.data.transitDurationHours,
    );
    return res.status(200).json({ success: true, data: lot, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateStatusHandler(req: Request, res: Response) {
  const parsed = updateLotStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }
  try {
    const lot = await lotsService.updateLotStatus(req.params.id, parsed.data.status);
    return res.status(200).json({ success: true, data: lot, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}
