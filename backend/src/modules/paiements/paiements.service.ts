import { Currency, PaymentMethod } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { resolveRateForFacture } from '@/lib/exchangeRate';
import { sendRelanceImpaye } from '@/lib/whatsapp/notifications';
import { ensureFactureForColis } from '@/modules/factures/factures.service';
import { computePaiementColis } from '@/modules/colis/colis.presenter';

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
// taux figé au moment du paiement — jamais recalculé rétroactivement). Le taux appliqué
// provient du lot des colis facturés si déterminable (Phase 3), sinon du taux global du jour
// (comportement historique inchangé).
export async function createPaiement(input: CreatePaiementInput, receivedByUserId: string) {
  return prisma.$transaction(async (tx) => {
    const facture = await tx.facture.findFirst({
      where: { id: input.factureId, deletedAt: null },
      include: { paiements: { where: { deletedAt: null } }, client: true, colis: true },
    });
    if (!facture) throw new PaiementError('Facture introuvable.', 404);

    const { rate: tauxVersGnf, source: tauxSource, lotId: tauxLotId } = await resolveRateForFacture(
      input.currency,
      facture.colis.map((c) => c.lotId),
      tx,
    );
    const montantGnf = input.montant * tauxVersGnf;

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

    if (input.currency !== 'GNF') {
      await tx.auditLog.create({
        data: {
          userId: receivedByUserId,
          action: 'paiement:taux_resolu',
          entityType: 'Paiement',
          entityId: paiement.id,
          metadata: { source: tauxSource, lotId: tauxLotId, tauxApplique: tauxVersGnf },
        },
      });
    }

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

interface CreatePaiementForColisInput {
  colisId: string;
  montant: number;
  currency: Currency;
  tauxVersGnf?: number;
  method: PaymentMethod;
  reference?: string;
  datePaiement?: Date;
  commentaire?: string;
}

// Paiement colis-par-colis (module Agent Guinée) — règle 2 : un paiement doit référencer un
// colis appartenant au lot indiqué en paramètre de route, sinon erreur 422. Garantit la
// facture mono-colis (créée automatiquement si absente), puis délègue à createPaiement pour
// ne pas dupliquer la logique de taux/statut/solde déjà éprouvée.
export async function createPaiementForColis(
  lotId: string,
  input: CreatePaiementForColisInput,
  userId: string,
) {
  const colis = await prisma.colis.findFirst({ where: { id: input.colisId, deletedAt: null } });
  if (!colis) throw new PaiementError('Colis introuvable.', 404);
  if (colis.lotId !== lotId) {
    throw new PaiementError("Ce colis n'appartient pas au lot indiqué.", 422);
  }

  const factureId = await prisma.$transaction(async (tx) => {
    const facture = await ensureFactureForColis(input.colisId, tx);
    return facture.id;
  });

  // Avertissement non bloquant si le montant dépasse le reste à payer (règle : bloquer
  // seulement si montant <= 0, jamais si le client paie plus que dû — cf. TROP_PERCU).
  const factureAvecPaiements = await prisma.facture.findUniqueOrThrow({
    where: { id: factureId },
    include: { paiements: { where: { deletedAt: null } } },
  });
  const { resteAPayerGnf } = computePaiementColis(factureAvecPaiements);
  const montantGnfEstime = input.currency === 'GNF' ? input.montant : input.montant * (input.tauxVersGnf ?? 1);
  const avertissement =
    montantGnfEstime > resteAPayerGnf && resteAPayerGnf > 0
      ? `Le montant saisi dépasse le reste à payer (${Math.round(resteAPayerGnf).toLocaleString('fr-FR')} GNF) — l'excédent sera enregistré comme trop-perçu.`
      : undefined;

  const paiement = await createPaiement(
    { factureId, montant: input.montant, currency: input.currency, method: input.method },
    userId,
  );

  return { paiement, avertissement };
}

export async function getPaiementForReceipt(paiementId: string) {
  const paiement = await prisma.paiement.findFirst({
    where: { id: paiementId, deletedAt: null },
    include: { facture: { include: { client: true, colis: true } } },
  });
  if (!paiement) throw new PaiementError('Paiement introuvable.', 404);

  // Pas de relation Prisma déclarée sur receivedByUserId (champ libre) — lookup manuel.
  const agent = paiement.receivedByUserId
    ? await prisma.user.findUnique({ where: { id: paiement.receivedByUserId } })
    : null;

  return { paiement, agent };
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
