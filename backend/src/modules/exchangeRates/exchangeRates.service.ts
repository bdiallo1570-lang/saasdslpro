import { prisma } from '@/lib/prisma';
import { CreateRateInput } from './exchangeRates.schema';

// Taux de change manuels, historisés — jamais modifiés rétroactivement, on crée toujours
// une nouvelle ligne datée (règle 3.2 GEMINI.md). Vers GNF uniquement (seule conversion
// utilisée dans le système actuellement).
export async function createRate(input: CreateRateInput, createdByUserId: string) {
  return prisma.exchangeRate.create({
    data: {
      fromCurrency: input.fromCurrency,
      toCurrency: 'GNF',
      rate: input.rate,
      effectiveFrom: input.effectiveFrom,
      createdByUserId,
    },
  });
}

export async function listRates() {
  return prisma.exchangeRate.findMany({
    where: { toCurrency: 'GNF' },
    orderBy: [{ fromCurrency: 'asc' }, { effectiveFrom: 'desc' }],
  });
}
