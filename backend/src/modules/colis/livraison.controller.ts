import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { canReadPricing, computePaiementColis } from './colis.presenter';

// Marque un colis comme livré. Bloqué côté backend si la facture associée n'est pas
// payée, sauf si un déblocage manuel admin a été tracé (règle 3.4 GEMINI.md).
export async function marquerLivreHandler(req: Request, res: Response) {
  const trackingId = req.params.trackingId;

  const colis = await prisma.colis.findFirst({
    where: { trackingId, deletedAt: null },
    include: { facture: { include: { paiements: { where: { deletedAt: null } } } } },
  });

  if (!colis) {
    return res.status(404).json({ success: false, data: null, error: 'Colis introuvable.' });
  }

  if (colis.facture && colis.facture.status !== 'PAYE' && !colis.facture.livraisonDebloqueeManuel) {
    const { resteAPayerGnf } = computePaiementColis(colis.facture);
    return res.status(403).json({
      success: false,
      data: null,
      error: `Sortie bloquée — reste à payer : ${Math.round(resteAPayerGnf).toLocaleString('fr-FR')} GNF`,
    });
  }

  const updated = await prisma.colis.update({
    where: { id: colis.id },
    data: { status: 'LIVRE' },
  });

  if (canReadPricing(req.user!.roleName)) {
    return res.status(200).json({ success: true, data: updated, error: null });
  }
  const { montantEstime, currency, pricingRuleId, categorieTarif, ...rest } = updated;
  return res.status(200).json({ success: true, data: rest, error: null });
}
