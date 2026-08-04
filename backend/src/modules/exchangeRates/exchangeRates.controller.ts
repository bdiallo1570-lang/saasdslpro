import { Request, Response } from 'express';
import * as exchangeRatesService from './exchangeRates.service';
import { createRateSchema } from './exchangeRates.schema';

export async function createRateHandler(req: Request, res: Response) {
  const parsed = createRateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }
  const rate = await exchangeRatesService.createRate(parsed.data, req.user!.sub);
  return res.status(201).json({ success: true, data: rate, error: null });
}

export async function listRatesHandler(_req: Request, res: Response) {
  const rates = await exchangeRatesService.listRates();
  return res.status(200).json({ success: true, data: rates, error: null });
}
