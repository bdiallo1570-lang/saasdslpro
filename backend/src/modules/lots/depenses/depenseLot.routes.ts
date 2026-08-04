import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import * as depenseLotController from './depenseLot.controller';

// Routes top-level /depenses/:id (distinctes de /lots/:lotId/depenses) — une dépense se
// modifie/supprime par son propre id, sans passer par le lot.
export const depenseLotRouter = Router();

depenseLotRouter.use(requireAuth);
depenseLotRouter.patch(
  '/:id',
  requirePermission('lots:write_costs'),
  asyncHandler(depenseLotController.updateDepenseHandler),
);
depenseLotRouter.delete(
  '/:id',
  requirePermission('lots:delete_costs'),
  asyncHandler(depenseLotController.deleteDepenseHandler),
);
