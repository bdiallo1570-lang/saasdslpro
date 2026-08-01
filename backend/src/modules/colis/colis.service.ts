import { prisma } from '@/lib/prisma';
import { nextSequenceNumber } from '@/lib/sequence';
import { getVolumetricDivisor } from '@/lib/settings';
import { computeVolumetricWeightKg, computeTaxableWeightKg } from '@/lib/weight';
import { getActivePricingRule, PricingError } from './pricing';
import { CreateColisInput } from './colis.schema';
import { sendConfirmationReception } from '@/lib/whatsapp/notifications';

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

    return tx.colis.create({
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
    include: { client: true, lot: true },
  });
}

export async function listColis(params: { lotId?: string; status?: string }) {
  return prisma.colis.findMany({
    where: {
      deletedAt: null,
      ...(params.lotId ? { lotId: params.lotId } : {}),
      ...(params.status ? { status: params.status as never } : {}),
    },
    include: { client: true },
    orderBy: { createdAt: 'desc' },
  });
}
