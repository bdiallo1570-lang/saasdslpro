import { Request, Response } from 'express';
import * as paiementsService from './paiements.service';
import { createPaiementSchema } from './paiements.schema';
import { getClientLink, getDocument } from '@/modules/documents/documents.service';
import { handleError } from '@/lib/errors';

export async function createPaiementHandler(req: Request, res: Response) {
  const parsed = createPaiementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }
  try {
    const paiement = await paiementsService.createPaiement(parsed.data, req.user!.sub);
    return res.status(201).json({ success: true, data: paiement, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listPaiementsHandler(req: Request, res: Response) {
  const paiements = await paiementsService.listPaiementsByFacture(req.params.factureId);
  return res.status(200).json({ success: true, data: paiements, error: null });
}

export async function downloadReceiptHandler(req: Request, res: Response) {
  try {
    const { buffer, filename } = await getDocument('recu', req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (error) {
    return handleError(res, error);
  }
}

// Lien de téléchargement à envoyer au client (WhatsApp)
export async function lienClientRecuHandler(req: Request, res: Response) {
  try {
    const data = await getClientLink('recu', req.params.id);
    return res.status(200).json({ success: true, data, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function relancerClientHandler(req: Request, res: Response) {
  try {
    const result = await paiementsService.relancerClientImpaye(req.params.clientId);
    return res.status(200).json({ success: true, data: result, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}
