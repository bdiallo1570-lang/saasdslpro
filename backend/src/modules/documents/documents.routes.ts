import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/lib/asyncHandler';
import { handleError } from '@/lib/errors';
import { verifyDocumentToken } from '@/lib/documentLinks';
import { publicTrackingRateLimiter } from '@/middleware/rateLimit';
import { DocumentError, getDocument } from './documents.service';

export const documentsRouter = Router();

// Public : le client ouvre le lien reçu sur WhatsApp (ou scanne le QR code du PDF) sans compte.
// L'accès repose uniquement sur la signature du lien (voir lib/documentLinks.ts).
function resolve(req: Request) {
  const doc = verifyDocumentToken(req.params.token);
  if (!doc) throw new DocumentError('Ce lien est invalide ou a expiré. Demandez-en un nouveau à DSL Air Cargo.', 404);
  return doc;
}

documentsRouter.get(
  '/:token',
  publicTrackingRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { type, id } = resolve(req);
      const { summary } = await getDocument(type, id, false);
      return res.status(200).json({ success: true, data: summary, error: null });
    } catch (error) {
      return handleError(res, error);
    }
  }),
);

// ?download=1 : téléchargement direct ; sinon ouverture dans le lecteur PDF du téléphone
documentsRouter.get(
  '/:token/pdf',
  publicTrackingRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { type, id } = resolve(req);
      const { buffer, filename } = await getDocument(type, id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `${req.query.download ? 'attachment' : 'inline'}; filename="${filename}"`,
      );
      res.setHeader('Cache-Control', 'private, no-store');
      return res.status(200).send(buffer);
    } catch (error) {
      return handleError(res, error);
    }
  }),
);
