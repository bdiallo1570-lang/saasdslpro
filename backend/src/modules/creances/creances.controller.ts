import { Request, Response } from 'express';
import * as creancesService from './creances.service';

export async function getKpisHandler(_req: Request, res: Response) {
  const kpis = await creancesService.getCreancesKpis();
  return res.status(200).json({ success: true, data: kpis, error: null });
}

export async function listDebiteursHandler(_req: Request, res: Response) {
  const debiteurs = await creancesService.listClientsDebiteurs();
  return res.status(200).json({ success: true, data: debiteurs, error: null });
}
