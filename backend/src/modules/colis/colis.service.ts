import { prisma } from '@/lib/prisma';
import { nextSequenceNumber } from '@/lib/sequence';
import { getVolumetricDivisor } from '@/lib/settings';
import { computeVolumetricWeightKg, computeTaxableWeightKg } from '@/lib/weight';
import { getActivePricingRule, PricingError } from './pricing';
import { CreateColisInput } from './colis.schema';
import { sendConfirmationReception } from '@/lib/whatsapp/notifications';
import { ensureFactureForColis } from '@/modules/factures/factures.service';

export { PricingError };

export async function createColis(input: CreateColisInput, createdByUserId: string) {
  const divisor = await getVolumetricDivisor();

  const poidsVolumetriqueKg =
    input.longueurCm && input.largeurCm && input.hauteurCm
      ? computeVolumetricWeightKg(input.longueurCm, input.largeurCm, input.hauteurCm, divisor)
      : 0;

  const poidsTaxableKg = computeTaxableWeightKg(input.poidsReelKg, poidsVolumetriqueKg);

  const colis = await prisma.$transaction(async (tx) => {
    const client = await tx.client.findFirst({ where: { id: input.clientId, deletedAt: null } });
    if (!client) {
      throw new PricingError('Client introuvable.', 404);
    }

    let pricePerKg: number;
    let pricingRuleId: string;
    let currency: 'GNF' | 'USD' | 'EUR' | 'CNY';

    if (input.categorieTarif === 'PERSONNALISE') {
      if (!input.tarifManuelParKg || !input.motifTarifManuel) {
        throw new PricingError(
          'Un tarif manuel et un motif sont requis pour la catégorie personnalisée.',
        );
      }
      // Cas exceptionnel : on rattache tout de même au tarif STANDARD en vigueur pour la
      // traçabilité de la ligne, mais le prix appliqué est le tarif manuel saisi.
      const standardRule = await getActivePricingRule('STANDARD', tx);
      pricingRuleId = standardRule.id;
      pricePerKg = input.tarifManuelParKg;
      currency = standardRule.currency;

      await tx.auditLog.create({
        data: {
          userId: createdByUserId,
          action: 'colis:tarif_manuel',
          entityType: 'Colis',
          reason: input.motifTarifManuel,
          metadata: { tarifManuelParKg: input.tarifManuelParKg },
        },
      });
    } else {
      const rule = await getActivePricingRule(input.categorieTarif, tx);
      pricingRuleId = rule.id;
      pricePerKg = Number(rule.pricePerKg);
      currency = rule.currency;
    }

    // Règle 3.1 : facturation actuelle au POIDS RÉEL uniquement.
    const montantEstime = input.poidsReelKg * pricePerKg;

    const trackingId = await nextSequenceNumber(tx, 'LTA', 'DSL');

    const created = await tx.colis.create({
      data: {
        trackingId,
        clientId: input.clientId,
        description: input.description,
        poidsReelKg: input.poidsReelKg,
        longueurCm: input.longueurCm ?? null,
        largeurCm: input.largeurCm ?? null,
        hauteurCm: input.hauteurCm ?? null,
        poidsVolumetriqueKg,
        poidsTaxableKg,
        categorieTarif: input.categorieTarif,
        pricingRuleId,
        montantEstime,
        currency,
        photos: input.photos ?? undefined,
        createdByUserId,
      },
      include: { client: true },
    });

    // Trace pour le fil d'actualité transversal (Admin/Agent Chine/Agent Guinée) — la
    // seule trace de création existante auparavant était limitée au cas tarif manuel.
    await tx.auditLog.create({
      data: {
        userId: createdByUserId,
        action: 'colis:cree',
        entityType: 'Colis',
        entityId: created.id,
        metadata: { trackingId: created.trackingId },
      },
    });

    return created;
  });

  const phone = colis.client.phoneWhatsapp || colis.client.phoneGn;
  if (phone) {
    sendConfirmationReception(
      colis.client.id,
      phone,
      colis.trackingId,
      Number(colis.montantEstime),
      colis.currency,
    ).catch((err) => console.error('Échec envoi confirmation WhatsApp :', err));
  }

  return colis;
}

export async function getColisByTrackingId(trackingId: string) {
  return prisma.colis.findFirst({
    where: { trackingId, deletedAt: null },
    include: {
      client: true,
      lot: true,
      facture: { include: { paiements: { where: { deletedAt: null } } } },
    },
  });
}

export async function listColis(params: { lotId?: string; status?: string | string[] }) {
  const statusFilter = Array.isArray(params.status)
    ? { status: { in: params.status as never[] } }
    : params.status
      ? { status: params.status as never }
      : {};

  return prisma.colis.findMany({
    where: {
      deletedAt: null,
      ...(params.lotId ? { lotId: params.lotId } : {}),
      ...statusFilter,
    },
    include: {
      client: true,
      facture: { include: { paiements: { where: { deletedAt: null } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

const STATUTS_MODIFIABLES_MANUELLEMENT = [
  'ENREGISTRE',
  'ASSIGNE_LOT',
  'ENVOLE',
  'ARRIVE',
  'EN_DEDOUANEMENT',
  'DISPONIBLE_ENTREPOT',
] as const;

// Mise à jour manuelle de statut depuis les pills du Dashboard Financier et depuis l'écran de
// contrôle Agent Guinée. LIVRE est exclu délibérément : la transition vers "livré" reste
// réservée au flux de scan/livraison dédié (marquerColisLivre) qui vérifie le verrou entrepôt
// lié au paiement (règle 3.4 GEMINI.md) — contourner ce contrôle via un simple update de statut
// casserait cette règle non négociable.
export async function updateColisStatus(trackingId: string, status: string, userId: string) {
  if (!(STATUTS_MODIFIABLES_MANUELLEMENT as readonly string[]).includes(status)) {
    throw new PricingError(
      'Ce statut ne peut pas être appliqué ici — utilisez le flux de scan/livraison pour marquer un colis livré.',
      400,
    );
  }

  const colis = await prisma.colis.findFirst({ where: { trackingId, deletedAt: null } });
  if (!colis) {
    throw new PricingError('Colis introuvable.', 404);
  }

  // Interdit tout retour en arrière ou saut : seule la progression vers l'étape suivante (ou
  // le statut déjà atteint, no-op) est autorisée. Évite qu'un colis déjà facturé/en entrepôt
  // soit accidentellement remis à un statut antérieur via un appel API direct.
  const currentIndex = STATUTS_MODIFIABLES_MANUELLEMENT.indexOf(
    colis.status as (typeof STATUTS_MODIFIABLES_MANUELLEMENT)[number],
  );
  const targetIndex = STATUTS_MODIFIABLES_MANUELLEMENT.indexOf(
    status as (typeof STATUTS_MODIFIABLES_MANUELLEMENT)[number],
  );
  if (currentIndex !== -1 && targetIndex < currentIndex) {
    throw new PricingError(
      `Impossible de revenir en arrière : le colis est déjà au statut « ${colis.status} ».`,
      400,
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.colis.update({
      where: { id: colis.id },
      data: { status: status as never },
      include: { client: true },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'colis:statut_modifie',
        entityType: 'Colis',
        entityId: colis.id,
        metadata: { trackingId, ancienStatut: colis.status, nouveauStatut: status },
      },
    });

    // Facturation automatique 1 colis = 1 facture (module Agent Guinée) — dès que le colis
    // arrive à Conakry, il devient facturable/payable, indépendamment du dédouanement.
    if (status === 'ARRIVE') {
      await ensureFactureForColis(colis.id, tx);
    }

    return updated;
  });
}

// Modification du prix par l'Agent Chine (ou l'Admin), tracée dans AuditLog avec motif
// obligatoire. Verrouillé dès qu'un paiement a été enregistré sur le colis — le montant payé
// est figé au taux du moment, le modifier après coup rendrait le solde client incohérent sans
// logique de remboursement (hors scope). Resynchronise Facture.montantTotal et
// Client.outstandingBalance dans la même transaction si une facture existe déjà (colis ARRIVE),
// pour ne jamais laisser Colis/Facture/Client diverger (aucune de ces valeurs n'est recalculée
// automatiquement ailleurs dans le système).
export async function updateColisPrice(
  trackingId: string,
  nouveauMontant: number,
  motif: string,
  userId: string,
) {
  const colis = await prisma.colis.findFirst({
    where: { trackingId, deletedAt: null },
    include: { facture: { include: { paiements: { where: { deletedAt: null } } } } },
  });
  if (!colis) {
    throw new PricingError('Colis introuvable.', 404);
  }

  if (colis.facture && colis.facture.paiements.length > 0) {
    throw new PricingError(
      'Impossible de modifier le prix : un paiement a déjà été enregistré sur ce colis.',
      409,
    );
  }

  const ancienMontant = Number(colis.montantEstime);
  const delta = nouveauMontant - ancienMontant;

  return prisma.$transaction(async (tx) => {
    await tx.colis.update({
      where: { id: colis.id },
      data: { montantEstime: nouveauMontant },
    });

    if (colis.factureId) {
      // La facture peut en théorie couvrir plusieurs colis (createFacture accepte un tableau) —
      // on ajuste son montantTotal du delta plutôt que de l'écraser avec le seul nouveau prix
      // de ce colis, pour ne pas effacer la contribution des autres colis de la même facture.
      await tx.facture.update({
        where: { id: colis.factureId },
        data: { montantTotal: { increment: delta } },
      });
      await tx.client.update({
        where: { id: colis.clientId },
        data: { outstandingBalance: { increment: delta } },
      });
    }

    await tx.auditLog.create({
      data: {
        userId,
        action: 'colis:prix_modifie',
        entityType: 'Colis',
        entityId: colis.id,
        reason: motif,
        metadata: { trackingId, ancienMontant, nouveauMontant, currency: colis.currency },
      },
    });

    // Recharge avec la facture+paiements à jour pour que presentColis puisse recalculer
    // montantDuGnf/resteAPayerGnf/statutPaiement dans la réponse immédiate (sinon le frontend
    // affiche des valeurs de paiement obsolètes jusqu'au prochain rafraîchissement).
    return tx.colis.findUniqueOrThrow({
      where: { id: colis.id },
      include: { client: true, facture: { include: { paiements: { where: { deletedAt: null } } } } },
    });
  });
}
