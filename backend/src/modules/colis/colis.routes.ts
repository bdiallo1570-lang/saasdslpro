import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import * as colisController from './colis.controller';
import { scanColisHandler } from './scan.controller';
import { marquerLivreHandler } from './livraison.controller';
import { publicTrackColisHandler } from './publicTracking.controller';

export const colisRouter = Router();

// Routes publiques (landing page, aucune authentification) — placées avant requireAuth.
colisRouter.post('/simulate-price', colisController.simulatePriceHandler);
colisRouter.get('/track/:trackingId', asyncHandler(publicTrackColisHandler));

colisRouter.use(requireAuth);
colisRouter.get('/', requirePermission('colis:read'), colisController.listColisHandler);
colisRouter.post('/', requirePermission('colis:write'), colisController.createColisHandler);
colisRouter.get(
  '/scan/:trackingId',
  requirePermission('entrepot:read'),
  scanColisHandler,
);
colisRouter.post(
  '/:trackingId/livrer',
  requirePermission('entrepot:write'),
  marquerLivreHandler,
);
colisRouter.get('/:trackingId', requirePermission('colis:read'), colisController.getColisHandler);
