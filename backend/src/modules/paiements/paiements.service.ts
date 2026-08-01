import { Currency, PaymentMethod } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentRateToGnf } from '@/lib/exchangeRate';
import { sendRelanceImpaye } from '@/lib/whatsapp/notifications';

export class PaiementError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

interface CreatePaiementInput {
  factureId: string;
  montant: number;
  currency: Currency;
  method: PaymentMethod;
  closureId?: string;
}

// Enregistre un paiement (règle 3.6 : plusieurs paiements possibles, devises différentes,
// taux figé au moment du paiement — jamais recalculé rétroactivement).
export async function createPaiement(input: CreatePaiementInput, receivedByUserId: string) {
  const tauxVersGnf = await getCurrentRateToGnf(input.currency);
  const montantGnf = input.montant * tauxVersGnf;

  return prisma.$transaction(async (tx) => {
    const facture = await tx.facture.findFirst({
      where: { id: input.factureId, deletedAt: null },
      include: { paiements: { where: { deletedAt: null } }, client: true },
    });
    if (!facture) throw new PaiementError('Facture introuvable.', 404);

    let cashTransactionId: string | null = null;
    if (input.closureId) {
      const closure = await tx.cashRegisterClosure.findFirst({
        where: { id: input.closureId, status: 'OUVERTE' },
      });
      if (!closure) throw new PaiementError('Caisse du jour introuvable ou déjà clôturée.', 404);

      const cashTx = await tx.cashTransaction.create({
        data: {
          closureId: input.closureId,
          type: 'ENTREE',
          label: `Paiement facture ${facture.factureNumber}`,
          montant: input.montant,
          currency: input.currency,
          method: input.method,
          createdByUserId: receivedByUserId,
        },
      });
      cashTransactionId = cashTx.id;
    }

    const paiement = await tx.paiement.create({
      data: {
        factureId: input.factureId,
        montant: input.montant,
        currency: input.currency,
        tauxVersGnf,
        method: input.method,
        cashTransactionId,
        receivedByUserId,
      },
    });

    // Total déjà payé en GNF (converti au taux figé de chaque paiement).
    const totalPayeGnf =
      facture.paiements.reduce((sum, p) => sum + Number(p.montant) * Number(p.tauxVersGnf), 0) +
      montantGnf;
    const montantTotalGnf = Number(facture.montantTotal) * (facture.currency === 'GNF' ? 1 : tauxVersGnf);

    const newStatus =
      totalPayeGnf >= montantTotalGnf ? 'PAYE' : totalPayeGnf > 0 ? 'PARTIEL' : 'IMPAYE';

    await tx.facture.update({ where: { id: input.factureId }, data: { status: newStatus } });

    await tx.client.update({
      where: { id: facture.clientId },
      data: {
        totalSpent: { increment: montantGnf },
        outstandingBalance: { decrement: montantGnf },
      },
    });

    return tx.paiement.findUniqueOrThrow({ where: { id: paiement.id } });
  });
}

export async function listPaiementsByFacture(factureId: string) {
  return prisma.paiement.findMany({
    where: { factureId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPaiementForReceipt(paiementId: string) {
  const paiement = await prisma.paiement.findFirst({
    where: { id: paiementId, deletedAt: null },
    include: { facture: { include: { client: true } } },
  });
  if (!paiement) throw new PaiementError('Paiement introuvable.', 404);
  return paiement;
}

// Bouton "Relancer sur WhatsApp" — envoie le modèle de relance avec le montant exact dû.
export async function relancerClientImpaye(clientId: string) {
  const client = await prisma.client.findFirst({ where: { id: clientId, deletedAt: null } });
  if (!client) throw new PaiementError('Client introuvable.', 404);

  const phone = client.phoneWhatsapp || client.phoneGn;
  if (!phone) throw new PaiementError("Le client n'a pas de numéro WhatsApp/téléphone enregistré.");

  const montantDu = Number(client.outstandingBalance);
  if (montantDu <= 0) throw new PaiementError("Ce client n'a pas de solde impayé.");

  return sendRelanceImpaye(client.id, phone, client.fullName, montantDu, 'GNF');
}
