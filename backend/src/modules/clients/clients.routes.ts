import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import * as clientsController from './clients.controller';

export const clientsRouter = Router();

clientsRouter.use(requireAuth);

clientsRouter.get(
  '/',
  requirePermission('clients:read'),
  asyncHandler(clientsController.searchClientsHandler),
);
clientsRouter.post(
  '/',
  requirePermission('clients:write'),
  asyncHandler(clientsController.createClientHandler),
);
// Route spécifique placée AVANT /:id pour ne pas être capturée par la route paramétrique.
clientsRouter.get(
  '/liste-complete',
  requirePermission('clients:read'),
  asyncHandler(clientsController.listAllClientsHandler),
);
clientsRouter.get(
  '/:id',
  requirePermission('clients:read'),
  asyncHandler(clientsController.getClientHandler),
);
