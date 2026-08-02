import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import * as facturesController from './factures.controller';

export const facturesRouter = Router();

facturesRouter.use(requireAuth);

facturesRouter.post(
  '/',
  requirePermission('factures:write'),
  asyncHandler(facturesController.createFactureHandler),
);
facturesRouter.get(
  '/:id',
  requirePermission('factures:read'),
  asyncHandler(facturesController.getFactureHandler),
);
facturesRouter.get(
  '/client/:clientId',
  requirePermission('factures:read'),
  asyncHandler(facturesController.listFacturesByClientHandler),
);
facturesRouter.get(
  '/client/:clientId/colis-non-factures',
  requirePermission('factures:read'),
  asyncHandler(facturesController.listUnbilledColisHandler),
);
facturesRouter.post(
  '/:id/debloquer-livraison',
  requirePermission('livraison:deblocage_force'),
  asyncHandler(facturesController.debloquerLivraisonHandler),
);
