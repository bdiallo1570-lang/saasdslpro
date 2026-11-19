import { Router } from 'express';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/asyncHandler';

import { consultationPubliqueLimiter } from '@/middleware/antiSpam';

export const warehousesRouter = Router();

// Public : les adresses d'entrepôts sont destinées à être partagées avec les clients/prospects,
// y compris depuis la landing page avant connexion.
warehousesRouter.get(
  '/',
  consultationPubliqueLimiter,
  asyncHandler(async (_req, res) => {
    const warehouses = await prisma.warehouseLocation.findMany({ orderBy: { name: 'asc' } });
    return res.status(200).json({ success: true, data: warehouses, error: null });
  }),
);
