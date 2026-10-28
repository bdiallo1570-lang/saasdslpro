import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';

// Suivi de colis public (landing page, aucune authentification requise).
// N'expose JAMAIS de données client (nom, téléphone, solde), ni le contenu ou le poids du
// colis : les Tracking ID étant séquentiels, n'importe qui pourrait sinon lister le contenu de
// tous les colis. Uniquement le statut et le trajet.
export async function publicTrackColisHandler(req: Request, res: Response) {
  const trackingId = req.params.trackingId;

  const colis = await prisma.colis.findFirst({
    where: { trackingId, deletedAt: null },
    include: { lot: true },
  });

  if (!colis) {
    return res.status(404).json({
      success: false,
      data: null,
      error: 'Aucun colis trouvé avec ce numéro de suivi.',
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      trackingId: colis.trackingId,
      status: colis.status,
      createdAt: colis.createdAt,
      lot: colis.lot
        ? {
            lotNumber: colis.lot.lotNumber,
            status: colis.lot.status,
            departureDate: colis.lot.departureDate,
            estimatedArrival: colis.lot.estimatedArrival,
          }
        : null,
    },
    error: null,
  });
}
