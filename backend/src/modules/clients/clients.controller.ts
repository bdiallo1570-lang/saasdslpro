import { Request, Response } from 'express';
import * as clientsService from './clients.service';
import { createClientSchema } from './clients.schema';

export async function searchClientsHandler(req: Request, res: Response) {
  const query = typeof req.query.q === 'string' ? req.query.q : undefined;
  const clients = await clientsService.searchClients(query);
  return res.status(200).json({ success: true, data: clients, error: null });
}

export async function listAllClientsHandler(_req: Request, res: Response) {
  const clients = await clientsService.listAllClients();
  return res.status(200).json({ success: true, data: clients, error: null });
}

export async function createClientHandler(req: Request, res: Response) {
  const parsed = createClientSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: parsed.error.issues[0].message });
  }

  const client = await clientsService.createClient(parsed.data);
  return res.status(201).json({ success: true, data: client, error: null });
}

export async function getClientHandler(req: Request, res: Response) {
  const client = await clientsService.getClientById(req.params.id);
  if (!client) {
    return res.status(404).json({ success: false, data: null, error: 'Client introuvable.' });
  }
  return res.status(200).json({ success: true, data: client, error: null });
}
