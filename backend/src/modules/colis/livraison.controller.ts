import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';

// Marque un colis comme livré. Bloqué côté backend si la facture associée n'est pas
// payée, sauf si un déblocage manuel admin a été tracé (règle 3.4 GEMINI.md).
export async function marquerLivreHandler(req: Request, res: Response) {
  const trackingId = req.params.trackingId;

  const colis = await prisma.colis.findFirst({
    where: { trackingId, deletedAt: null },
    include: { facture: true },
  });

  if (!colis) {
    return res.status(404).json({ success: false, data: null, error: 'Colis introuvable.' });
  }

  if (colis.facture && colis.facture.status !== 'PAYE' && !colis.facture.livraisonDebloqueeManuel) {
    return res.status(403).json({
      success: false,
      data: null,
      error:
        "Livraison bloquée : la facture associée n'est pas payée. Un déblocage manuel admin est requis.",
    });
  }

  const updated = await prisma.colis.update({
    where: { id: colis.id },
    data: { status: 'LIVRE' },
  });

  return res.status(200).json({ success: true, data: updated, error: null });
}
