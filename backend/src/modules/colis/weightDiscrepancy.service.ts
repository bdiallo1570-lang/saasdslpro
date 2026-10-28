import { prisma } from '@/lib/prisma';
import { getWeightDiscrepancyThreshold } from '@/lib/settings';
import { AppError } from '@/lib/errors';

export class WeightDiscrepancyError extends AppError {}

// Signale un écart entre le poids saisi en Chine (Colis.poidsReelKg, jamais modifié) et le
// poids constaté par l'Agent Guinée à l'arrivée. Journalisé systématiquement (même sous le
// seuil), alerte visible Admin uniquement si l'écart dépasse le seuil configurable (défaut 3%).
export async function reportWeightDiscrepancy(
  colisId: string,
  poidsGuineeKg: number,
  agentGuineeUserId: string,
) {
  const colis = await prisma.colis.findFirst({ where: { id: colisId, deletedAt: null } });
  if (!colis) {
    throw new WeightDiscrepancyError('Colis introuvable.', 404);
  }

  const seuil = await getWeightDiscrepancyThreshold();
  const poidsChine = Number(colis.poidsReelKg);
  const ecartPourcent = poidsChine > 0 ? (Math.abs(poidsGuineeKg - poidsChine) / poidsChine) * 100 : 0;
  const depasseSeuil = ecartPourcent > seuil;

  return prisma.$transaction(async (tx) => {
    const discrepancy = await tx.weightDiscrepancy.create({
      data: {
        colisId,
        lotId: colis.lotId,
        poidsChineKg: colis.poidsReelKg,
        poidsGuineeKg,
        ecartPourcent,
        seuilAppliquePourcent: seuil,
        depasseSeuil,
        agentChineUserId: colis.createdByUserId,
        agentGuineeUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: agentGuineeUserId,
        action: 'colis:ecart_poids_signale',
        entityType: 'Colis',
        entityId: colisId,
        metadata: {
          lotId: colis.lotId,
          poidsChineKg: poidsChine,
          poidsGuineeKg,
          ecartPourcent,
          seuilAppliquePourcent: seuil,
          depasseSeuil,
          agentChineUserId: colis.createdByUserId,
          agentGuineeUserId,
        },
      },
    });

    return discrepancy;
  });
}

export async function listUnresolvedDiscrepancies() {
  return prisma.weightDiscrepancy.findMany({
    where: { depasseSeuil: true, resolvedAt: null },
    include: { colis: { include: { client: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function resolveDiscrepancy(id: string, resolvedByUserId: string, resolutionNote?: string) {
  const discrepancy = await prisma.weightDiscrepancy.findUnique({ where: { id } });
  if (!discrepancy) {
    throw new WeightDiscrepancyError('Écart de poids introuvable.', 404);
  }

  return prisma.$transaction(async (tx) => {
    const resolved = await tx.weightDiscrepancy.update({
      where: { id },
      data: { resolvedAt: new Date(), resolvedByUserId, resolutionNote: resolutionNote ?? null },
    });

    await tx.auditLog.create({
      data: {
        userId: resolvedByUserId,
        action: 'colis:ecart_poids_resolu',
        entityType: 'Colis',
        entityId: discrepancy.colisId,
        reason: resolutionNote,
        metadata: { weightDiscrepancyId: id },
      },
    });

    return resolved;
  });
}
