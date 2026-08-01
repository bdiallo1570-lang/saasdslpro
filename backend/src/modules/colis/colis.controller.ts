import { Request, Response } from 'express';
import * as colisService from './colis.service';
import { createColisSchema, priceSimulationSchema } from './colis.schema';
import { getActivePricingRule } from './pricing';

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

  try {
    const colis = await colisService.createColis(parsed.data, req.user!.sub);
    return res.status(201).json({ success: true, data: colis, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getColisHandler(req: Request, res: Response) {
  const colis = await colisService.getColisByTrackingId(req.params.trackingId);
  if (!colis) {
    return res.status(404).json({ success: false, data: null, error: 'Colis introuvable.' });
  }
  return res.status(200).json({ success: true, data: colis, error: null });
}

export async function listColisHandler(req: Request, res: Response) {
  const lotId = typeof req.query.lotId === 'string' ? req.query.lotId : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const colis = await colisService.listColis({ lotId, status });
  return res.status(200).json({ success: true, data: colis, error: null });
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
