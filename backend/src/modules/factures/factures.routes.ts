import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import * as facturesController from './factures.controller';

export const facturesRouter = Router();

facturesRouter.use(requireAuth);

facturesRouter.post('/', requirePermission('factures:write'), facturesController.createFactureHandler);
facturesRouter.get('/:id', requirePermission('factures:read'), facturesController.getFactureHandler);
facturesRouter.get(
  '/client/:clientId',
  requirePermission('factures:read'),
  facturesController.listFacturesByClientHandler,
);
facturesRouter.get(
  '/client/:clientId/colis-non-factures',
  requirePermission('factures:read'),
  facturesController.listUnbilledColisHandler,
);
facturesRouter.post(
  '/:id/debloquer-livraison',
  requirePermission('livraison:deblocage_force'),
  facturesController.debloquerLivraisonHandler,
);
