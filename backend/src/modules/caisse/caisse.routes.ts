import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import * as caisseController from './caisse.controller';

export const caisseRouter = Router();

caisseRouter.use(requireAuth);
caisseRouter.use(requirePermission('caisse:read'));

caisseRouter.get('/ouverte', asyncHandler(caisseController.getOpenClosureHandler));
caisseRouter.get('/', asyncHandler(caisseController.listClosuresHandler));
caisseRouter.get('/:id', asyncHandler(caisseController.getClosureHandler));
caisseRouter.get('/:id/rapport-pdf', asyncHandler(caisseController.downloadClosureReportHandler));

caisseRouter.post(
  '/ouvrir',
  requirePermission('caisse:write'),
  asyncHandler(caisseController.openClosureHandler),
);
caisseRouter.post(
  '/transactions',
  requirePermission('caisse:write'),
  asyncHandler(caisseController.createTransactionHandler),
);
caisseRouter.post(
  '/:id/cloturer',
  requirePermission('caisse:write'),
  asyncHandler(caisseController.closeClosureHandler),
);
