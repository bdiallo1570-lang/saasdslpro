import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import * as parametresAlertesController from './parametresAlertes.controller';

export const parametresAlertesRouter = Router();

parametresAlertesRouter.use(requireAuth);
parametresAlertesRouter.get(
  '/',
  requirePermission('parametres:read'),
  asyncHandler(parametresAlertesController.getSeuilsAlertesHandler),
);
parametresAlertesRouter.patch(
  '/',
  requirePermission('parametres:write'),
  asyncHandler(parametresAlertesController.updateSeuilsAlertesHandler),
);
