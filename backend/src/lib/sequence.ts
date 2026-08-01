import { Prisma, SequenceType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Numérotation séquentielle sans trou, réinitialisée chaque année (règle 3.3 GEMINI.md).
// Doit être appelée à l'intérieur d'une transaction Prisma pour garantir l'absence de
// doublons en cas d'accès concurrent (verrouillage implicite via l'upsert atomique).
export async function nextSequenceNumber(
  tx: Prisma.TransactionClient,
  sequenceType: SequenceType,
  prefix: string,
  year = new Date().getFullYear(),
): Promise<string> {
  const counter = await tx.sequenceCounter.upsert({
    where: { sequenceType_year: { sequenceType, year } },
    update: { lastValue: { increment: 1 } },
    create: { sequenceType, year, lastValue: 1 },
  });

  const padded = String(counter.lastValue).padStart(5, '0');
  return `${prefix}-${year}-${padded}`;
}
