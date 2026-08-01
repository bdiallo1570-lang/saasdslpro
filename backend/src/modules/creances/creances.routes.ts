import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import * as creancesController from './creances.controller';

export const creancesRouter = Router();

creancesRouter.use(requireAuth);
// Vue créances/impayés = donnée financière -> réservée à l'Admin (règle RLS applicative, cf. README §3).
creancesRouter.use(requirePermission('finance:read_margins'));

creancesRouter.get('/kpis', creancesController.getKpisHandler);
creancesRouter.get('/debiteurs', creancesController.listDebiteursHandler);
