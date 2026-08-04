import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import * as creancesController from './creances.controller';

export const creancesRouter = Router();

creancesRouter.use(requireAuth);
// Vue créances/impayés = donnée financière -> Admin + Agent Guinée (module Agent Guinée,
// gestion de l'encaissement) — jamais Agent Chine ni Client.
creancesRouter.use(requirePermission('finance:read_margins'));

creancesRouter.get('/kpis', asyncHandler(creancesController.getKpisHandler));
creancesRouter.get('/debiteurs', asyncHandler(creancesController.listDebiteursHandler));
