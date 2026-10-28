import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import { publicTrackingRateLimiter } from '@/middleware/rateLimit';
import * as colisController from './colis.controller';
import { scanColisHandler } from './scan.controller';
import { marquerLivreHandler, bonDeSortiePdfHandler } from './livraison.controller';
import { publicTrackColisHandler } from './publicTracking.controller';
import * as weightDiscrepancyController from './weightDiscrepancy.controller';

export const colisRouter = Router();

// Routes publiques (landing page, aucune authentification) — placées avant requireAuth.
colisRouter.post('/simulate-price', asyncHandler(colisController.simulatePriceHandler));
colisRouter.get('/track/:trackingId', publicTrackingRateLimiter, asyncHandler(publicTrackColisHandler));

colisRouter.use(requireAuth);
colisRouter.get('/', requirePermission('colis:read'), asyncHandler(colisController.listColisHandler));
colisRouter.post(
  '/',
  requirePermission('colis:write'),
  asyncHandler(colisController.createColisHandler),
);

// Écarts de poids — routes spécifiques placées AVANT /:trackingId pour ne pas être capturées
// par la route paramétrique générique.
colisRouter.get(
  '/ecarts-poids',
  requirePermission('colis:read_discrepancy_alerts'),
  asyncHandler(weightDiscrepancyController.listUnresolvedDiscrepanciesHandler),
);
colisRouter.patch(
  '/ecarts-poids/:id/resoudre',
  requirePermission('colis:read_discrepancy_alerts'),
  asyncHandler(weightDiscrepancyController.resolveDiscrepancyHandler),
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
  '/:trackingId/bon-de-sortie-pdf',
  requirePermission('entrepot:read'),
  asyncHandler(bonDeSortiePdfHandler),
);
colisRouter.post(
  '/:trackingId/signaler-ecart-poids',
  requirePermission('colis:report_weight_discrepancy'),
  asyncHandler(weightDiscrepancyController.reportDiscrepancyHandler),
);
colisRouter.patch(
  '/:trackingId/statut',
  requirePermission('colis:update_status'),
  asyncHandler(colisController.updateColisStatusHandler),
);
colisRouter.patch(
  '/:trackingId/prix',
  requirePermission('colis:write_pricing'),
  asyncHandler(colisController.updateColisPriceHandler),
);
colisRouter.get(
  '/:colisId/paiements',
  requirePermission('colis:read'),
  asyncHandler(colisController.listPaiementsForColisHandler),
);
colisRouter.get(
  '/:trackingId',
  requirePermission('colis:read'),
  asyncHandler(colisController.getColisHandler),
);
