import { Request, Response } from 'express';
import * as rentabiliteService from './rentabilite.service';
import { generateLotBalanceReportPdf } from '@/lib/pdf/lotBalanceReport';

function handleError(res: Response, error: unknown) {
  if (error instanceof rentabiliteService.RentabiliteError) {
    return res.status(error.statusCode).json({ success: false, data: null, error: error.message });
  }
  console.error(error);
  return res.status(500).json({ success: false, data: null, error: 'Erreur interne du serveur.' });
}

export async function getRentabiliteHandler(req: Request, res: Response) {
  try {
    const rentabilite = await rentabiliteService.getRentabiliteLot(req.params.lotId);
    return res.status(200).json({ success: true, data: rentabilite, error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function downloadBilanPdfHandler(req: Request, res: Response) {
  try {
    const rentabilite = await rentabiliteService.getRentabiliteLot(req.params.lotId);
    const pdfBuffer = await generateLotBalanceReportPdf(rentabilite);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bilan-${rentabilite.lotNumber}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    return handleError(res, error);
  }
}
