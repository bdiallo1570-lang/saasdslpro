import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import * as caisseController from './caisse.controller';

export const caisseRouter = Router();

caisseRouter.use(requireAuth);
caisseRouter.use(requirePermission('caisse:read'));

caisseRouter.get('/ouverte', caisseController.getOpenClosureHandler);
caisseRouter.get('/', caisseController.listClosuresHandler);
caisseRouter.get('/:id', caisseController.getClosureHandler);
caisseRouter.get('/:id/rapport-pdf', caisseController.downloadClosureReportHandler);

caisseRouter.post('/ouvrir', requirePermission('caisse:write'), caisseController.openClosureHandler);
caisseRouter.post(
  '/transactions',
  requirePermission('caisse:write'),
  caisseController.createTransactionHandler,
);
caisseRouter.post('/:id/cloturer', requirePermission('caisse:write'), caisseController.closeClosureHandler);
