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

// Mise à jour manuelle de statut depuis les pills du Dashboard Financier. LIVRE est exclu
// délibérément : la transition vers "livré" reste réservée au flux de scan/livraison dédié
// (marquerColisLivre) qui vérifie le verrou entrepôt lié au paiement (règle 3.4 GEMINI.md) —
// contourner ce contrôle via un simple update de statut casserait cette règle non négociable.
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
