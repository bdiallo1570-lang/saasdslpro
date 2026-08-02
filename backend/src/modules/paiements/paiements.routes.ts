import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import * as paiementsController from './paiements.controller';

export const paiementsRouter = Router();

paiementsRouter.use(requireAuth);

paiementsRouter.post(
  '/',
  requirePermission('caisse:write'),
  asyncHandler(paiementsController.createPaiementHandler),
);
paiementsRouter.get(
  '/facture/:factureId',
  requirePermission('factures:read'),
  asyncHandler(paiementsController.listPaiementsHandler),
);
paiementsRouter.get(
  '/:id/recu-pdf',
  requirePermission('factures:read'),
  asyncHandler(paiementsController.downloadReceiptHandler),
);
paiementsRouter.post(
  '/relancer/:clientId',
  requirePermission('whatsapp:send'),
  asyncHandler(paiementsController.relancerClientHandler),
);
