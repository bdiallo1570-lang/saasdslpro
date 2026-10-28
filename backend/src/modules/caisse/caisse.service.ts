import { Currency, CashTransactionType, PaymentMethod, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

export class CaisseError extends AppError {}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Ouvre la caisse du jour pour une devise donnée (une caisse par jour et par devise —
// journal de caisse par jour et par devise, règle GEMINI.md §4 module Caisse).
export async function openClosure(currency: Currency, fondOuverture: number, userId: string, date?: Date) {
  const day = startOfDay(date ?? new Date());

  const existing = await prisma.cashRegisterClosure.findUnique({
    where: { date_currency: { date: day, currency } },
  });
  if (existing) {
    throw new CaisseError(`Une caisse ${currency} est déjà ouverte ou clôturée pour cette date.`);
  }

  return prisma.cashRegisterClosure.create({
    data: { date: day, currency, fondOuverture, openedByUserId: userId },
  });
}

export async function getOpenClosure(currency: Currency, date?: Date) {
  const day = startOfDay(date ?? new Date());
  return prisma.cashRegisterClosure.findUnique({
    where: { date_currency: { date: day, currency } },
    include: { transactions: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } } },
  });
}

export async function listClosures(limit = 30) {
  return prisma.cashRegisterClosure.findMany({
    orderBy: { date: 'desc' },
    take: limit,
  });
}

export async function getClosureById(id: string) {
  return prisma.cashRegisterClosure.findUnique({
    where: { id },
    include: { transactions: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } } },
  });
}

export async function createTransaction(input: {
  closureId: string;
  type: CashTransactionType;
  category?: string;
  label: string;
  montant: number;
  currency: Currency;
  method?: PaymentMethod;
  createdByUserId: string;
}) {
  const closure = await prisma.cashRegisterClosure.findFirst({
    where: { id: input.closureId, status: 'OUVERTE' },
  });
  if (!closure) throw new CaisseError('Caisse introuvable ou déjà clôturée.', 404);

  if (closure.currency !== input.currency) {
    throw new CaisseError(
      `Cette caisse est en ${closure.currency} ; impossible d'y enregistrer une transaction en ${input.currency}.`,
    );
  }

  return prisma.cashTransaction.create({
    data: {
      closureId: input.closureId,
      type: input.type,
      category: input.category || null,
      label: input.label,
      montant: input.montant,
      currency: input.currency,
      method: input.method,
      createdByUserId: input.createdByUserId,
    },
  });
}

// Solde théorique = fond d'ouverture + entrées - dépenses.
export function computeSoldeTheorique(
  fondOuverture: number,
  transactions: { type: CashTransactionType; montant: Prisma.Decimal | number | string }[],
) {
  const entrees = transactions
    .filter((t) => t.type === 'ENTREE')
    .reduce((sum, t) => sum + Number(t.montant), 0);
  const depenses = transactions
    .filter((t) => t.type === 'DEPENSE')
    .reduce((sum, t) => sum + Number(t.montant), 0);
  return fondOuverture + entrees - depenses;
}

// Clôture de caisse quotidienne avec comptage physique et calcul de l'écart.
export async function closeClosure(closureId: string, comptagePhysique: number, userId: string) {
  const closure = await prisma.cashRegisterClosure.findFirst({
    where: { id: closureId, status: 'OUVERTE' },
    include: { transactions: { where: { deletedAt: null } } },
  });
  if (!closure) throw new CaisseError('Caisse introuvable ou déjà clôturée.', 404);

  const soldeTheorique = computeSoldeTheorique(Number(closure.fondOuverture), closure.transactions);
  const ecart = comptagePhysique - soldeTheorique;

  return prisma.cashRegisterClosure.update({
    where: { id: closureId },
    data: {
      status: 'CLOTUREE',
      soldeTheorique,
      comptagePhysique,
      ecart,
      closedByUserId: userId,
      closedAt: new Date(),
    },
    include: { transactions: true },
  });
}
