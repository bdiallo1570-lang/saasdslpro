import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import * as exchangeRatesController from './exchangeRates.controller';

export const exchangeRatesRouter = Router();

exchangeRatesRouter.use(requireAuth);
exchangeRatesRouter.get(
  '/',
  requirePermission('parametres:read'),
  asyncHandler(exchangeRatesController.listRatesHandler),
);
exchangeRatesRouter.post(
  '/',
  requirePermission('parametres:write'),
  asyncHandler(exchangeRatesController.createRateHandler),
);
