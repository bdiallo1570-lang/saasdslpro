import { LotStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { nextSequenceNumber } from '@/lib/sequence';
import { sendArriveeLotNotification } from '@/lib/whatsapp/notifications';

export class LotError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

export async function createLot(flightNumber?: string) {
  return prisma.$transaction(async (tx) => {
    const lotNumber = await nextSequenceNumber(tx, 'LTA', 'LOT');
    return tx.lot.create({ data: { lotNumber, flightNumber: flightNumber || null } });
  });
}

export async function listLots() {
  return prisma.lot.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { colis: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getLotById(id: string) {
  return prisma.lot.findFirst({
    where: { id, deletedAt: null },
    include: { colis: { include: { client: true } } },
  });
}

export async function assignColisToLot(lotId: string, colisIds: string[]) {
  const lot = await prisma.lot.findFirst({ where: { id: lotId, deletedAt: null } });
  if (!lot) throw new LotError('Lot introuvable.', 404);

  await prisma.colis.updateMany({
    where: { id: { in: colisIds }, deletedAt: null },
    data: { lotId, status: 'ASSIGNE_LOT' },
  });

  return getLotById(lotId);
}

// Saisie de la date d'embarquement + calcul automatique de l'ETA Conakry.
export async function setLotFlightInfo(
  lotId: string,
  flightNumber: string,
  departureDate: Date,
  transitDurationHours: number,
) {
  const lot = await prisma.lot.findFirst({ where: { id: lotId, deletedAt: null } });
  if (!lot) throw new LotError('Lot introuvable.', 404);

  const estimatedArrival = new Date(departureDate.getTime() + transitDurationHours * 60 * 60 * 1000);

  return prisma.lot.update({
    where: { id: lotId },
    data: {
      flightNumber,
      departureDate,
      estimatedArrival,
      status: 'ENVOLE',
    },
  });
}

export async function updateLotStatus(lotId: string, status: LotStatus) {
  const lot = await prisma.lot.findFirst({ where: { id: lotId, deletedAt: null } });
  if (!lot) throw new LotError('Lot introuvable.', 404);

  const updatedLot = await prisma.lot.update({ where: { id: lotId }, data: { status } });

  // Le passage du lot en entrepôt propage le statut "disponible" à ses colis
  // (utilisé par le scan QR Agent Guinée — module Arrivée Madina) et déclenche
  // une notification WhatsApp groupée par client concerné.
  if (status === 'EN_ENTREPOT') {
    await prisma.colis.updateMany({
      where: { lotId, deletedAt: null },
      data: { status: 'DISPONIBLE_ENTREPOT' },
    });

    const colisDuLot = await prisma.colis.findMany({
      where: { lotId, deletedAt: null },
      include: { client: true },
    });

    const trackingIdsByClient = new Map<string, { client: (typeof colisDuLot)[number]['client']; trackingIds: string[] }>();
    for (const c of colisDuLot) {
      const entry = trackingIdsByClient.get(c.clientId);
      if (entry) {
        entry.trackingIds.push(c.trackingId);
      } else {
        trackingIdsByClient.set(c.clientId, { client: c.client, trackingIds: [c.trackingId] });
      }
    }

    for (const { client, trackingIds } of trackingIdsByClient.values()) {
      const phone = client.phoneWhatsapp || client.phoneGn;
      if (phone) {
        sendArriveeLotNotification(client.id, phone, updatedLot.lotNumber, trackingIds).catch((err) =>
          console.error('Échec notification arrivée lot WhatsApp :', err),
        );
      }
    }
  }

  return updatedLot;
}
