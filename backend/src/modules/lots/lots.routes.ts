import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import * as lotsController from './lots.controller';

export const lotsRouter = Router();

lotsRouter.use(requireAuth);
lotsRouter.get('/', requirePermission('lots:read'), lotsController.listLotsHandler);
lotsRouter.post('/', requirePermission('lots:write'), lotsController.createLotHandler);
lotsRouter.get('/:id', requirePermission('lots:read'), lotsController.getLotHandler);
lotsRouter.post('/:id/assign-colis', requirePermission('lots:write'), lotsController.assignColisHandler);
lotsRouter.patch('/:id/flight-info', requirePermission('lots:write'), lotsController.setFlightInfoHandler);
lotsRouter.patch(
  '/:id/status',
  requirePermission('lots:update_status'),
  lotsController.updateStatusHandler,
);
