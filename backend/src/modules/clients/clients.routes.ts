import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import * as clientsController from './clients.controller';
import { activerEspaceClient, getEspaceClient } from './espaceClient.service';
import { handleError } from '@/lib/errors';

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
// Espace client (portail) : état du compte, puis activation ou nouveaux accès
clientsRouter.get(
  '/:id/espace-client',
  requirePermission('clients:read'),
  asyncHandler(async (req, res) => {
    const data = await getEspaceClient(req.params.id);
    return res.status(200).json({ success: true, data, error: null });
  }),
);
clientsRouter.post(
  '/:id/espace-client',
  requirePermission('clients:write'),
  asyncHandler(async (req, res) => {
    try {
      const data = await activerEspaceClient(req.params.id);
      return res.status(200).json({ success: true, data, error: null });
    } catch (error) {
      return handleError(res, error);
    }
  }),
);
clientsRouter.put(
  '/:id',
  requirePermission('clients:write'),
  asyncHandler(clientsController.updateClientHandler),
);
clientsRouter.delete(
  '/:id',
  requirePermission('clients:write'),
  asyncHandler(clientsController.deleteClientHandler),
);
