import { Prisma, PricingCategory } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class PricingError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

// Retourne le tarif actif en vigueur pour une catégorie donnée.
// Les tarifs sont historisés (règle 3.5) : on prend le plus récent avec isActive=true.
export async function getActivePricingRule(
  categoryName: Exclude<PricingCategory, 'PERSONNALISE'>,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  const rule = await client.pricingRule.findFirst({
    where: { categoryName, isActive: true },
    orderBy: { effectiveFrom: 'desc' },
  });

  if (!rule) {
    throw new PricingError(`Aucun tarif actif configuré pour la catégorie ${categoryName}.`);
  }

  return rule;
}
