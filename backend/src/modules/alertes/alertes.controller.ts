import { Request, Response } from 'express';
import * as alertesService from './alertes.service';

export async function listAlertesHandler(req: Request, res: Response) {
  const niveau =
    typeof req.query.niveau === 'string' && ['CRITIQUE', 'ATTENTION', 'INFO'].includes(req.query.niveau)
      ? (req.query.niveau as alertesService.NiveauAlerte)
      : undefined;
  const lotId = typeof req.query.lotId === 'string' ? req.query.lotId : undefined;
  const clientId = typeof req.query.clientId === 'string' ? req.query.clientId : undefined;

  const alertes = await alertesService.listAlertes({ niveau, lotId, clientId });
  return res.status(200).json({ success: true, data: alertes, error: null });
}
