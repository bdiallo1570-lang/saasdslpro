import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import * as clientsController from './clients.controller';

export const clientsRouter = Router();

clientsRouter.use(requireAuth);

clientsRouter.get('/', requirePermission('clients:read'), clientsController.searchClientsHandler);
clientsRouter.post('/', requirePermission('clients:write'), clientsController.createClientHandler);
clientsRouter.get('/:id', requirePermission('clients:read'), clientsController.getClientHandler);
