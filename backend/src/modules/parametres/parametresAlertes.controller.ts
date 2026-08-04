import { Request, Response } from 'express';
import { getSeuilsAlertes, setSeuilsAlertes } from '@/lib/settings';
import { updateSeuilsAlertesSchema } from './parametresAlertes.schema';

export async function getSeuilsAlertesHandler(_req: Request, res: Response) {
  const seuils = await getSeuilsAlertes();
  return res.status(200).json({ success: true, data: seuils, error: null });
}

export async function updateSeuilsAlertesHandler(req: Request, res: Response) {
  const parsed = updateSeuilsAlertesSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  const seuils = await setSeuilsAlertes(parsed.data);
  return res.status(200).json({ success: true, data: seuils, error: null });
}
