import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import * as lotsController from './lots.controller';
import * as depenseLotController from './depenses/depenseLot.controller';
import * as rentabiliteController from './rentabilite/rentabilite.controller';
import * as paiementsLotController from './paiements/paiementsLot.controller';

export const lotsRouter = Router();

lotsRouter.use(requireAuth);
lotsRouter.get('/', requirePermission('lots:read'), asyncHandler(lotsController.listLotsHandler));
lotsRouter.post('/', requirePermission('lots:write'), asyncHandler(lotsController.createLotHandler));
lotsRouter.get('/:id', requirePermission('lots:read'), asyncHandler(lotsController.getLotHandler));
lotsRouter.post(
  '/:id/assign-colis',
  requirePermission('lots:write'),
  asyncHandler(lotsController.assignColisHandler),
);
lotsRouter.patch(
  '/:id/flight-info',
  requirePermission('lots:write'),
  asyncHandler(lotsController.setFlightInfoHandler),
);
lotsRouter.patch(
  '/:id/status',
  requirePermission('lots:update_status'),
  asyncHandler(lotsController.updateStatusHandler),
);

// Dépenses de lot (module Agent Guinée) — chaque lot est une unité économique autonome.
lotsRouter.get(
  '/:lotId/depenses',
  requirePermission('lots:read_costs'),
  asyncHandler(depenseLotController.listDepensesHandler),
);
lotsRouter.post(
  '/:lotId/depenses',
  requirePermission('lots:write_costs'),
  asyncHandler(depenseLotController.createDepenseHandler),
);

// Rentabilité de lot.
lotsRouter.get(
  '/:lotId/rentabilite',
  requirePermission('finance:read_margins'),
  asyncHandler(rentabiliteController.getRentabiliteHandler),
);
lotsRouter.get(
  '/:lotId/bilan.pdf',
  requirePermission('finance:read_margins'),
  asyncHandler(rentabiliteController.downloadBilanPdfHandler),
);

// Paiements colis regroupés par lot / par client.
// Route spécifique placée AVANT /:lotId/paiements pour ne pas être capturée par la route
// paramétrique — vue globale tous lots confondus (onglet Caisse Madina, Agent Guinée).
lotsRouter.get(
  '/paiements/par-lot',
  requirePermission('lots:read_costs'),
  asyncHandler(paiementsLotController.getPaiementsParLotHandler),
);
lotsRouter.get(
  '/:lotId/paiements',
  requirePermission('lots:read_costs'),
  asyncHandler(paiementsLotController.listPaiementsByLotHandler),
);
lotsRouter.get(
  '/:lotId/paiements/par-client',
  requirePermission('lots:read_costs'),
  asyncHandler(paiementsLotController.getPaiementsParClientHandler),
);
lotsRouter.post(
  '/:lotId/paiements',
  requirePermission('paiements:write'),
  asyncHandler(paiementsLotController.createPaiementHandler),
);
