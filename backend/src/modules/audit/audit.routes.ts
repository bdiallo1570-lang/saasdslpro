import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import * as auditController from './audit.controller';

export const auditRouter = Router();

auditRouter.use(requireAuth);
auditRouter.get(
  '/recent',
  requirePermission('audit:read'),
  asyncHandler(auditController.listRecentAuditLogsHandler),
);
