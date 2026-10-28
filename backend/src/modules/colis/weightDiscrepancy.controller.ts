import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import * as weightDiscrepancyService from './weightDiscrepancy.service';
import { reportWeightDiscrepancySchema, resolveDiscrepancySchema } from './colis.schema';
import { handleError } from '@/lib/errors';

export async function reportDiscrepancyHandler(req: Request, res: Response) {
  const parsed = reportWeightDiscrepancySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  const colis = await prisma.colis.findFirst({
    where: { trackingId: req.params.trackingId, deletedAt: null },
  });
  if (!colis) {
    return res.status(404).json({ success: false, data: null, error: 'Colis introuvable.' });
  }

  try {
    const discrepancy = await weightDiscrepancyService.reportWeightDiscrepancy(
      colis.id,
      parsed.data.poidsGuineeKg,
      req.user!.sub,
    );
    return res.status(201).json({ success: true, data: discrepancy, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listUnresolvedDiscrepanciesHandler(_req: Request, res: Response) {
  const discrepancies = await weightDiscrepancyService.listUnresolvedDiscrepancies();
  return res.status(200).json({ success: true, data: discrepancies, error: null });
}

export async function resolveDiscrepancyHandler(req: Request, res: Response) {
  const parsed = resolveDiscrepancySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  try {
    const resolved = await weightDiscrepancyService.resolveDiscrepancy(
      req.params.id,
      req.user!.sub,
      parsed.data.resolutionNote,
    );
    return res.status(200).json({ success: true, data: resolved, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}
