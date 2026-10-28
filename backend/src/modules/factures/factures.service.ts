import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { nextSequenceNumber } from '@/lib/sequence';
import { resolveRateForFacture } from '@/lib/exchangeRate';
import { generateFacturePdf, FactureCompletePourPdf } from '@/lib/pdf/facturePdf';
import { AppError } from '@/lib/errors';

export class FactureError extends AppError {}

// Génère une facture à partir de colis non encore facturés d'un même client.
// Le montant total agrège montantEstime des colis sélectionnés (règle 3.1 : poids réel).
export async function createFacture(clientId: string, colisIds: string[]) {
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.findFirst({ where: { id: clientId, deletedAt: null } });
    if (!client) throw new FactureError('Client introuvable.', 404);

    // Même verrou que ensureFactureForColis : empêche deux factures simultanées sur un même colis.
    await tx.$queryRaw`SELECT id FROM colis WHERE id = ANY(${colisIds}) FOR UPDATE`;

    const colis = await tx.colis.findMany({
      where: { id: { in: colisIds }, clientId, factureId: null, deletedAt: null },
    });

    if (colis.length !== colisIds.length) {
      throw new FactureError(
        'Certains colis sont introuvables, déjà facturés, ou n\'appartiennent pas à ce client.',
      );
    }

    const currency = colis[0].currency;
    if (colis.some((c) => c.currency !== currency)) {
      throw new FactureError('Impossible de facturer des colis avec des devises différentes ensemble.');
    }

    const montantTotal = colis.reduce((sum, c) => sum + Number(c.montantEstime), 0);
    const factureNumber = await nextSequenceNumber(tx, 'FACTURE', 'FAC');

    const facture = await tx.facture.create({
      data: {
        factureNumber,
        clientId,
        montantTotal,
        currency,
        status: 'IMPAYE',
      },
    });

    await tx.colis.updateMany({
      where: { id: { in: colisIds } },
      data: { factureId: facture.id },
    });

    const { rate: tauxVersGnf } = await resolveRateForFacture(
      currency,
      colis.map((c) => c.lotId),
      tx,
    );
    const montantGnf = montantTotal * tauxVersGnf;

    await tx.client.update({
      where: { id: clientId },
      data: { outstandingBalance: { increment: montantGnf } },
    });

    return tx.facture.findUniqueOrThrow({
      where: { id: facture.id },
      include: { colis: true, client: true },
    });
  });
}

// Facturation automatique 1 colis = 1 facture (module Agent Guinée) — dès qu'un colis devient
// facturable (arrivée), on lui garantit une facture mono-colis pour que le solde/reste à payer
// puisse être suivi précisément par colis, sans dupliquer la logique de createFacture ci-dessus.
// Idempotent : no-op si le colis a déjà une facture. Doit être appelée dans une transaction.
export async function ensureFactureForColis(colisId: string, tx: Prisma.TransactionClient) {
  // Verrou de ligne : deux appels simultanés (passage du lot en entrepôt + statut ARRIVE, ou
  // deux agents) liraient sinon tous les deux factureId = null et créeraient deux factures.
  await tx.$queryRaw`SELECT id FROM colis WHERE id = ${colisId} FOR UPDATE`;

  const colis = await tx.colis.findFirst({ where: { id: colisId, deletedAt: null } });
  if (!colis) throw new FactureError('Colis introuvable.', 404);
  if (colis.factureId) return tx.facture.findUniqueOrThrow({ where: { id: colis.factureId } });

  const factureNumber = await nextSequenceNumber(tx, 'FACTURE', 'FAC');

  const facture = await tx.facture.create({
    data: {
      factureNumber,
      clientId: colis.clientId,
      montantTotal: colis.montantEstime,
      currency: colis.currency,
      status: 'IMPAYE',
    },
  });

  await tx.colis.update({ where: { id: colisId }, data: { factureId: facture.id } });

  const { rate: tauxVersGnf } = await resolveRateForFacture(
    colis.currency,
    [colis.lotId],
    tx,
  );
  const montantGnf = Number(colis.montantEstime) * tauxVersGnf;

  await tx.client.update({
    where: { id: colis.clientId },
    data: { outstandingBalance: { increment: montantGnf } },
  });

  return facture;
}

export async function getFactureById(id: string) {
  return prisma.facture.findFirst({
    where: { id, deletedAt: null },
    include: {
      colis: { include: { lot: true, pricingRule: true } },
      client: true,
      paiements: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
    },
  });
}

export async function getFacturePdf(id: string): Promise<{ buffer: Buffer; factureNumber: string }> {
  const facture = await getFactureById(id);
  if (!facture) throw new FactureError('Facture introuvable.', 404);

  const buffer = await generateFacturePdf(facture as FactureCompletePourPdf);
  return { buffer, factureNumber: facture.factureNumber };
}

export async function listFacturesByClient(clientId: string) {
  return prisma.facture.findMany({
    where: { clientId, deletedAt: null },
    include: { colis: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listUnbilledColisForClient(clientId: string) {
  return prisma.colis.findMany({
    where: { clientId, factureId: null, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

// Déblocage manuel de livraison malgré facture impayée (règle 3.4) — motif obligatoire, tracé.
export async function debloquerLivraison(factureId: string, adminUserId: string, motif: string) {
  const facture = await prisma.facture.findFirst({ where: { id: factureId, deletedAt: null } });
  if (!facture) throw new FactureError('Facture introuvable.', 404);

  const updated = await prisma.$transaction(async (tx) => {
    const f = await tx.facture.update({
      where: { id: factureId },
      data: {
        livraisonDebloqueeManuel: true,
        livraisonDeblocageMotif: motif,
        livraisonDeblocageParId: adminUserId,
        livraisonDeblocageAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'facture:deblocage_livraison',
        entityType: 'Facture',
        entityId: factureId,
        reason: motif,
      },
    });

    return f;
  });

  return updated;
}
