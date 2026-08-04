import { Currency, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type PrismaClientOrTx = typeof prisma | Prisma.TransactionClient;

// Taux de change manuels et historisés (règle 3.2 GEMINI.md) — jamais d'API externe.
// Retourne le taux en vigueur (le plus récent effectiveFrom <= maintenant) pour convertir
// `fromCurrency` vers GNF. Retourne 1 si fromCurrency est déjà GNF.
export async function getCurrentRateToGnf(
  fromCurrency: Currency,
  client: PrismaClientOrTx = prisma,
): Promise<number> {
  if (fromCurrency === 'GNF') return 1;

  const rate = await client.exchangeRate.findFirst({
    where: { fromCurrency, toCurrency: 'GNF', effectiveFrom: { lte: new Date() } },
    orderBy: { effectiveFrom: 'desc' },
  });

  if (!rate) {
    throw new Error(`Aucun taux de change configuré pour ${fromCurrency} → GNF.`);
  }

  return Number(rate.rate);
}

export type RateSource = 'lot' | 'global';

// Résout le taux vers GNF à appliquer pour une facture donnée : si TOUS les colis de la
// facture appartiennent à un même lot dont le taux a été figé à l'assignation, on utilise ce
// taux (règle : facturation au taux du lot, jamais le taux global du jour). Sinon (colis de
// lots différents, colis sans lot, ou lot sans taux figé), fallback explicite sur le taux
// global le plus récent — comportement identique à avant cette fonctionnalité.
export async function resolveRateForFacture(
  currency: Currency,
  colisLotIds: (string | null)[],
  client: PrismaClientOrTx = prisma,
): Promise<{ rate: number; source: RateSource; lotId: string | null }> {
  if (currency === 'GNF') return { rate: 1, source: 'lot', lotId: null };

  const uniqueLotIds = [...new Set(colisLotIds)];
  if (uniqueLotIds.length === 1 && uniqueLotIds[0]) {
    const lot = await client.lot.findUnique({ where: { id: uniqueLotIds[0] } });
    if (lot?.tauxVersGnfFige) {
      return { rate: Number(lot.tauxVersGnfFige), source: 'lot', lotId: lot.id };
    }
  }

  return { rate: await getCurrentRateToGnf(currency, client), source: 'global', lotId: null };
}
