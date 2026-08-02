import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import * as lotsController from './lots.controller';

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
