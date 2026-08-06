import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import * as colisService from './colis.service';
import {
  createColisSchema,
  priceSimulationSchema,
  updateColisStatusSchema,
  updateColisPriceSchema,
} from './colis.schema';
import { getActivePricingRule } from './pricing';
import { presentColis } from './colis.presenter';
import { listPaiementsByFacture } from '@/modules/paiements/paiements.service';

function handleError(res: Response, error: unknown) {
  if (error instanceof colisService.PricingError) {
    return res.status(error.statusCode).json({ success: false, data: null, error: error.message });
  }
  console.error(error);
  return res.status(500).json({ success: false, data: null, error: 'Erreur interne du serveur.' });
}

export async function createColisHandler(req: Request, res: Response) {
  const parsed = createColisSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  if (parsed.data.categorieTarif === 'PERSONNALISE' && req.user!.roleName !== 'Admin') {
    return res.status(403).json({
      success: false,
      data: null,
      error: 'Seul l\'Admin peut appliquer un tarif personnalisé.',
    });
  }

  try {
    const colis = await colisService.createColis(parsed.data, req.user!.sub);
    return res.status(201).json({ success: true, data: presentColis(colis, req.user!.roleName), error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getColisHandler(req: Request, res: Response) {
  const colis = await colisService.getColisByTrackingId(req.params.trackingId);
  if (!colis) {
    return res.status(404).json({ success: false, data: null, error: 'Colis introuvable.' });
  }
  return res.status(200).json({ success: true, data: presentColis(colis, req.user!.roleName), error: null });
}

export async function listColisHandler(req: Request, res: Response) {
  const lotId = typeof req.query.lotId === 'string' ? req.query.lotId : undefined;
  const statusRaw = typeof req.query.status === 'string' ? req.query.status : undefined;
  const status = statusRaw?.includes(',') ? statusRaw.split(',') : statusRaw;
  const colis = await colisService.listColis({ lotId, status });
  return res.status(200).json({
    success: true,
    data: colis.map((c) => presentColis(c, req.user!.roleName)),
    error: null,
  });
}

export async function updateColisStatusHandler(req: Request, res: Response) {
  const parsed = updateColisStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  try {
    const colis = await colisService.updateColisStatus(
      req.params.trackingId,
      parsed.data.status,
      req.user!.sub,
    );
    return res.status(200).json({ success: true, data: presentColis(colis, req.user!.roleName), error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateColisPriceHandler(req: Request, res: Response) {
  const parsed = updateColisPriceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  try {
    const colis = await colisService.updateColisPrice(
      req.params.trackingId,
      parsed.data.montantEstime,
      parsed.data.motif,
      req.user!.sub,
    );
    return res.status(200).json({ success: true, data: presentColis(colis, req.user!.roleName), error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listPaiementsForColisHandler(req: Request, res: Response) {
  const colis = await prisma.colis.findFirst({
    where: { id: req.params.colisId, deletedAt: null },
  });
  if (!colis) {
    return res.status(404).json({ success: false, data: null, error: 'Colis introuvable.' });
  }
  if (!colis.factureId) {
    return res.status(200).json({ success: true, data: [], error: null });
  }

  const paiements = await listPaiementsByFacture(colis.factureId);
  return res.status(200).json({ success: true, data: paiements, error: null });
}

// Simulateur de prix — accessible publiquement (landing page + Espace Client), aucune
// donnée client impliquée, juste un calcul indicatif basé sur les tarifs en vigueur.
export async function simulatePriceHandler(req: Request, res: Response) {
  const parsed = priceSimulationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  try {
    const rule = await getActivePricingRule(parsed.data.categorieTarif);
    const total = parsed.data.poidsKg * Number(rule.pricePerKg);
    return res.status(200).json({
      success: true,
      data: {
        poidsKg: parsed.data.poidsKg,
        categorieTarif: parsed.data.categorieTarif,
        pricePerKg: rule.pricePerKg,
        currency: rule.currency,
        totalEstime: total,
      },
      error: null,
    });
  } catch (error) {
    return handleError(res, error);
  }
}
