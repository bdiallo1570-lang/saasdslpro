import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import { handleError } from '@/lib/errors';
import { ROLE_NAMES } from '@/config/roles';
import { getClientLink, getDocument } from '@/modules/documents/documents.service';
import { devisSchema, statutSchema } from './devis.schema';
import * as devisService from './devis.service';

export const devisRouter = Router();

// Accès par rôle (et non par permission en base) : les permissions des rôles sont stockées en
// base et ne se mettent pas à jour au déploiement ; un rôle se vérifie sans migration de données.
devisRouter.use(requireAuth, requireRole(ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_GUINEE, ROLE_NAMES.AGENT_CHINE));

const variante = (req: Request) => (req.query.variante === 'proforma' ? 'proforma' : 'devis');

// Toutes les routes répondent au même format { success, data, error }
const handle =
  (fn: (req: Request) => Promise<unknown>, status = 200) =>
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await fn(req);
      return res.status(status).json({ success: true, data: data ?? null, error: null });
    } catch (error) {
      return handleError(res, error);
    }
  });

const valider = <T>(parsed: { success: true; data: T } | { success: false; error: { issues: { message: string }[] } }) => {
  if (!parsed.success) throw new devisService.DevisError(parsed.error.issues[0].message);
  return parsed.data;
};

// Tarifs utilisés pour pré-remplir et prévisualiser un devis (les montants définitifs sont
// toujours recalculés par le serveur à l'enregistrement)
devisRouter.get('/tarifs', handle(() => devisService.getTarifs()));

devisRouter.get(
  '/',
  handle((req) => devisService.listDevis({ q: req.query.q as string | undefined, statut: req.query.statut as string | undefined })),
);

devisRouter.get('/:id', handle(async (req) => devisService.serializeDevis(await devisService.getDevis(req.params.id))));

devisRouter.post('/', handle((req) => devisService.createDevis(valider(devisSchema.safeParse(req.body)), req.user!.sub), 201));

devisRouter.put('/:id', handle((req) => devisService.updateDevis(req.params.id, valider(devisSchema.safeParse(req.body)))));

devisRouter.patch(
  '/:id/statut',
  handle((req) => devisService.setStatut(req.params.id, valider(statutSchema.safeParse(req.body)).status)),
);

devisRouter.delete('/:id', handle((req) => devisService.deleteDevis(req.params.id)));

devisRouter.get(
  '/:id/pdf',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { buffer, filename } = await getDocument(variante(req), req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      return res.status(200).send(buffer);
    } catch (error) {
      return handleError(res, error);
    }
  }),
);

// Lien à envoyer au client (WhatsApp)
devisRouter.get('/:id/lien-client', handle((req) => getClientLink(variante(req), req.params.id)));
