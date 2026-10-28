import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CreateClientInput, UpdateClientInput } from './clients.schema';
import { AppError } from '@/lib/errors';

export class ClientError extends AppError {}

// Génère le prochain code client (format DSL-102), sans trou, dans une transaction.
async function nextClientCode(tx: Prisma.TransactionClient) {
  const existing = await tx.clientCodeCounter.findFirst();
  const counter = existing
    ? await tx.clientCodeCounter.update({
        where: { id: existing.id },
        data: { lastValue: { increment: 1 } },
      })
    : await tx.clientCodeCounter.create({ data: { lastValue: 101 } });

  return `DSL-${counter.lastValue}`;
}

export async function searchClients(query?: string) {
  if (!query) {
    return prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  return prisma.client.findMany({
    where: {
      deletedAt: null,
      OR: [
        { fullName: { contains: query, mode: 'insensitive' } },
        { clientCode: { contains: query, mode: 'insensitive' } },
        { phoneGn: { contains: query } },
        { phoneCn: { contains: query } },
        { phoneWhatsapp: { contains: query } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

export async function createClient(input: CreateClientInput) {
  return prisma.$transaction(async (tx) => {
    const clientCode = await nextClientCode(tx);
    return tx.client.create({
      data: {
        clientCode,
        fullName: input.fullName,
        phoneGn: input.phoneGn || null,
        phoneCn: input.phoneCn || null,
        phoneWhatsapp: input.phoneWhatsapp || null,
        address: input.address || null,
      },
    });
  });
}

export async function getClientById(id: string) {
  return prisma.client.findFirst({ where: { id, deletedAt: null } });
}

export async function updateClient(id: string, input: UpdateClientInput) {
  const client = await prisma.client.findFirst({ where: { id, deletedAt: null } });
  if (!client) throw new ClientError('Client introuvable.', 404);

  return prisma.client.update({
    where: { id },
    data: {
      fullName: input.fullName,
      phoneGn: input.phoneGn || null,
      phoneCn: input.phoneCn || null,
      phoneWhatsapp: input.phoneWhatsapp || null,
      address: input.address || null,
    },
  });
}

// Suppression douce (deletedAt) — refusée si le client a un colis non livré ou une facture
// non soldée, pour ne jamais faire disparaître un dossier en cours des listes actives.
export async function deleteClient(id: string) {
  const client = await prisma.client.findFirst({
    where: { id, deletedAt: null },
    include: {
      colis: { where: { deletedAt: null, status: { not: 'LIVRE' } } },
      factures: { where: { deletedAt: null, status: { not: 'PAYE' } } },
    },
  });
  if (!client) throw new ClientError('Client introuvable.', 404);

  if (client.colis.length > 0) {
    throw new ClientError(
      `Ce client a ${client.colis.length} colis non encore livré(s) — impossible de le supprimer.`,
      409,
    );
  }
  if (client.factures.length > 0) {
    throw new ClientError(
      `Ce client a ${client.factures.length} facture(s) non soldée(s) — impossible de le supprimer.`,
      409,
    );
  }

  await prisma.client.update({ where: { id }, data: { deletedAt: new Date() } });
}

// Liste complète des clients avec le nombre de colis associés — pour la page Clients
// (Admin/Agent Chine/Agent Guinée). Distinct de searchClients (bornée à 20, sans compteur,
// utilisée par ClientPicker) pour ne pas modifier son comportement existant.
export async function listAllClients() {
  const clients = await prisma.client.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { colis: true } } },
    orderBy: { fullName: 'asc' },
  });

  return clients.map((c) => ({
    id: c.id,
    clientCode: c.clientCode,
    fullName: c.fullName,
    phoneGn: c.phoneGn,
    phoneCn: c.phoneCn,
    phoneWhatsapp: c.phoneWhatsapp,
    // Un seul corridor commercial actif aujourd'hui (Chine → Guinée) — valeur fixe plutôt
    // qu'un champ en base tant qu'un second corridor n'existe pas réellement.
    corridor: 'Chine → Guinée',
    nombreColis: c._count.colis,
  }));
}
