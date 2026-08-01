import { Request, Response } from 'express';
import * as paiementsService from './paiements.service';
import { createPaiementSchema } from './paiements.schema';
import { generatePaymentReceiptPdf } from '@/lib/pdf/paymentReceipt';

function handleError(res: Response, error: unknown) {
  if (error instanceof paiementsService.PaiementError) {
    return res.status(error.statusCode).json({ success: false, data: null, error: error.message });
  }
  console.error(error);
  return res.status(500).json({ success: false, data: null, error: 'Erreur interne du serveur.' });
}

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
    const paiement = await paiementsService.getPaiementForReceipt(req.params.id);
    const pdfBuffer = await generatePaymentReceiptPdf({
      paiement,
      facture: paiement.facture,
      client: paiement.facture.client,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recu-${paiement.facture.factureNumber}.pdf"`);
    return res.send(pdfBuffer);
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
