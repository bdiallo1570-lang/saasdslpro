import { Currency } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Taux de change manuels et historisés (règle 3.2 GEMINI.md) — jamais d'API externe.
// Retourne le taux en vigueur (le plus récent effectiveFrom <= maintenant) pour convertir
// `fromCurrency` vers GNF. Retourne 1 si fromCurrency est déjà GNF.
export async function getCurrentRateToGnf(fromCurrency: Currency): Promise<number> {
  if (fromCurrency === 'GNF') return 1;

  const rate = await prisma.exchangeRate.findFirst({
    where: { fromCurrency, toCurrency: 'GNF', effectiveFrom: { lte: new Date() } },
    orderBy: { effectiveFrom: 'desc' },
  });

  if (!rate) {
    throw new Error(`Aucun taux de change configuré pour ${fromCurrency} → GNF.`);
  }

  return Number(rate.rate);
}
