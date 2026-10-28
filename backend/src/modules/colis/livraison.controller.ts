import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { canReadPricing, computePaiementColis, livraisonAutorisee } from './colis.presenter';
import { generateBonSortiePdf } from '@/lib/pdf/bonSortiePdf';

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

  if (colis.status === 'LIVRE') {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Ce colis a déjà été marqué comme livré.',
    });
  }

  // Règle 3.4 & 8 GEMINI.md : Un colis ne peut PAS être sorti / livré tant que sa facture
  // n'est pas marquée "Payée", sauf déblocage manuel admin tracé.
  if (!colis.facture) {
    return res.status(403).json({
      success: false,
      data: null,
      error: "Sortie bloquée — ce colis n'a pas encore de facture associée.",
    });
  }

  if (!livraisonAutorisee(colis.facture)) {
    const { resteAPayerGnf } = computePaiementColis(colis.facture);
    return res.status(403).json({
      success: false,
      data: null,
      error: `Sortie bloquée — reste à payer : ${Math.round(resteAPayerGnf).toLocaleString('fr-FR')} GNF`,
    });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.colis.update({
      where: { id: colis.id },
      data: { status: 'LIVRE' },
    });

    await tx.auditLog.create({
      data: {
        userId: req.user!.sub,
        action: 'colis:livre',
        entityType: 'Colis',
        entityId: colis.id,
        metadata: {
          trackingId: colis.trackingId,
          factureId: colis.facture?.id,
          livraisonDebloqueeManuel: colis.facture?.livraisonDebloqueeManuel ?? false,
        },
      },
    });

    return c;
  });

  if (canReadPricing(req.user!.roleName)) {
    return res.status(200).json({ success: true, data: updated, error: null });
  }
  const { montantEstime, currency, pricingRuleId, categorieTarif, ...rest } = updated;
  return res.status(200).json({ success: true, data: rest, error: null });
}

// Génère et télécharge le Bon de sortie d'entrepôt officiel (règle GEMINI.md §4 Module 8).
export async function bonDeSortiePdfHandler(req: Request, res: Response) {
  const trackingId = req.params.trackingId;
  const colis = await prisma.colis.findFirst({
    where: { trackingId, deletedAt: null },
    include: {
      client: true,
      lot: true,
      facture: true,
    },
  });

  if (!colis) {
    return res.status(404).json({ success: false, data: null, error: 'Colis introuvable.' });
  }

  // Autorisé si le colis est déjà livré OU si sa facture est soldée / débloquée manuellement
  if (colis.status !== 'LIVRE' && !livraisonAutorisee(colis.facture)) {
    return res.status(403).json({
      success: false,
      data: null,
      error: "Impossible d'éditer un bon de sortie : la facture n'est pas soldée et la sortie n'est pas autorisée.",
    });
  }

  // Retrouve l'agent ayant validé la livraison, sinon l'utilisateur connecté
  const auditLivraison = await prisma.auditLog.findFirst({
    where: { entityType: 'Colis', entityId: colis.id, action: 'colis:livre' },
    orderBy: { createdAt: 'desc' },
  });

  const agentId = auditLivraison?.userId || req.user!.sub;
  const agent = await prisma.user.findUnique({ where: { id: agentId } });

  const nomMandataire = typeof req.query.mandataire === 'string' ? req.query.mandataire : undefined;
  const pieceIdentite = typeof req.query.piece === 'string' ? req.query.piece : undefined;

  const buffer = await generateBonSortiePdf({
    colis,
    client: colis.client,
    facture: colis.facture,
    agentLivreur: agent,
    nomMandataire,
    pieceIdentite,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="bon-de-sortie-${colis.trackingId}.pdf"`);
  return res.status(200).send(buffer);
}
