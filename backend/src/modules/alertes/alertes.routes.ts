import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import * as alertesController from './alertes.controller';

export const alertesRouter = Router();

alertesRouter.use(requireAuth);
alertesRouter.get(
  '/',
  requirePermission('finance:read_margins'),
  asyncHandler(alertesController.listAlertesHandler),
);
