import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import * as colisController from './colis.controller';
import { scanColisHandler } from './scan.controller';
import { marquerLivreHandler } from './livraison.controller';
import { publicTrackColisHandler } from './publicTracking.controller';

export const colisRouter = Router();

// Routes publiques (landing page, aucune authentification) — placées avant requireAuth.
colisRouter.post('/simulate-price', asyncHandler(colisController.simulatePriceHandler));
colisRouter.get('/track/:trackingId', asyncHandler(publicTrackColisHandler));

colisRouter.use(requireAuth);
colisRouter.get('/', requirePermission('colis:read'), asyncHandler(colisController.listColisHandler));
colisRouter.post(
  '/',
  requirePermission('colis:write'),
  asyncHandler(colisController.createColisHandler),
);
colisRouter.get(
  '/scan/:trackingId',
  requirePermission('entrepot:read'),
  asyncHandler(scanColisHandler),
);
colisRouter.post(
  '/:trackingId/livrer',
  requirePermission('entrepot:write'),
  asyncHandler(marquerLivreHandler),
);
colisRouter.get(
  '/:trackingId',
  requirePermission('colis:read'),
  asyncHandler(colisController.getColisHandler),
);
