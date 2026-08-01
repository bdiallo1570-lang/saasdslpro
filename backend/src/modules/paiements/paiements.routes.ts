import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import * as paiementsController from './paiements.controller';

export const paiementsRouter = Router();

paiementsRouter.use(requireAuth);

paiementsRouter.post('/', requirePermission('caisse:write'), paiementsController.createPaiementHandler);
paiementsRouter.get(
  '/facture/:factureId',
  requirePermission('factures:read'),
  paiementsController.listPaiementsHandler,
);
paiementsRouter.get(
  '/:id/recu-pdf',
  requirePermission('factures:read'),
  paiementsController.downloadReceiptHandler,
);
paiementsRouter.post(
  '/relancer/:clientId',
  requirePermission('whatsapp:send'),
  paiementsController.relancerClientHandler,
);
