import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { canReadPricing, livraisonAutorisee } from './colis.presenter';

// Scan QR à l'arrivée entrepôt Madina (Agent Guinée) : identifie le colis et vérifie
// si sa facture est payée. Règle 3.4 GEMINI.md : un colis ne peut pas être livré tant
// que sa facture n'est pas payée, sauf déblocage manuel admin tracé au journal d'audit.
export async function scanColisHandler(req: Request, res: Response) {
  const trackingId = req.params.trackingId;

  const colis = await prisma.colis.findFirst({
    where: { trackingId, deletedAt: null },
    include: { client: true, lot: true, facture: true },
  });

  if (!colis) {
    return res.status(404).json({ success: false, data: null, error: 'Colis introuvable — vérifiez le code scanné.' });
  }

  const estPaye = colis.facture?.status === 'PAYE';
  const livraisonDebloqueeManuel = colis.facture?.livraisonDebloqueeManuel ?? false;

  // Agent Guinée : ne voit ni montant/devise du colis, ni créance client, ni montant de
  // facture — seulement les booléens dérivés nécessaires au verrou de livraison (règle 3.4).
  const canSeePricing = canReadPricing(req.user!.roleName);

  return res.status(200).json({
    success: true,
    data: {
      colis: {
        trackingId: colis.trackingId,
        description: colis.description,
        poidsReelKg: colis.poidsReelKg,
        status: colis.status,
        ...(canSeePricing ? { montantEstime: colis.montantEstime, currency: colis.currency } : {}),
      },
      client: {
        id: colis.client.id,
        clientCode: colis.client.clientCode,
        fullName: colis.client.fullName,
        ...(canSeePricing ? { outstandingBalance: colis.client.outstandingBalance } : {}),
      },
      lot: colis.lot ? { lotNumber: colis.lot.lotNumber, status: colis.lot.status } : null,
      facture: colis.facture
        ? {
            id: colis.facture.id,
            factureNumber: colis.facture.factureNumber,
            status: colis.facture.status,
            ...(canSeePricing ? { montantTotal: colis.facture.montantTotal } : {}),
            livraisonDebloqueeManuel,
          }
        : null,
      paymentStatus: !colis.facture ? 'NON_FACTURE' : estPaye ? 'PAYE' : 'IMPAYE_OU_PARTIEL',
      livraisonAutorisee: livraisonAutorisee(colis.facture),
    },
    error: null,
  });
}
