import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CreateClientInput } from './clients.schema';

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
