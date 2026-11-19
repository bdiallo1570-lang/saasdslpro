import { prisma } from '@/lib/prisma';
import { getVolumetricDivisor, getBillingMode } from '@/lib/settings';
import { computeVolumetricWeightKg, computeTaxableWeightKg } from '@/lib/weight';
import { getActivePricingRule, PricingError } from './pricing';
import { ModifierColisInput } from './colis.schema';

// Modification des informations saisies d'un colis, avec empreinte : chaque modification exige
// un motif et enregistre au journal (audit_logs, jamais effacé) qui, quand, et chaque valeur
// avant → après. L'historique d'un colis se relit avec listHistoriqueColis.

export type Valeur = string | number | null;

export interface Changement {
  champ: string;
  libelle: string;
  avant: Valeur;
  apres: Valeur;
}

export const LIBELLES_CHAMPS: Record<string, string> = {
  client: 'Client',
  description: 'Description',
  poidsReelKg: 'Poids réel (kg)',
  longueurCm: 'Longueur (cm)',
  largeurCm: 'Largeur (cm)',
  hauteurCm: 'Hauteur (cm)',
  categorieTarif: 'Catégorie',
  prixKg: 'Prix au kilo',
  montantEstime: 'Montant',
  dateReception: 'Date de réception',
};

// Champs qui changent le montant dû (ou à qui il est dû) : bloqués dès qu'un paiement existe
export const CHAMPS_PRIX = [
  'client',
  'poidsReelKg',
  'longueurCm',
  'largeurCm',
  'hauteurCm',
  'categorieTarif',
  'prixKg',
  'montantEstime',
];

// Liste des champs dont la valeur change (comparaison des valeurs affichables)
export function comparer(avant: Record<string, Valeur>, apres: Record<string, Valeur>): Changement[] {
  return Object.keys(apres)
    .filter((champ) => avant[champ] !== apres[champ])
    .map((champ) => ({ champ, libelle: LIBELLES_CHAMPS[champ] ?? champ, avant: avant[champ], apres: apres[champ] }));
}

const arrondi2 = (v: number) => Math.round(v * 100) / 100;
const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

export async function modifierColis(trackingId: string, input: ModifierColisInput, userId: string) {
  const colis = await prisma.colis.findFirst({
    where: { trackingId, deletedAt: null },
    include: { client: true, facture: { include: { paiements: { where: { deletedAt: null } } } } },
  });
  if (!colis) throw new PricingError('Colis introuvable.', 404);

  const [divisor, billingMode] = await Promise.all([getVolumetricDivisor(), getBillingMode()]);

  // Nouvelles valeurs (champ absent = inchangé)
  const nouveauClient =
    input.clientId && input.clientId !== colis.clientId
      ? await prisma.client.findFirst({ where: { id: input.clientId, deletedAt: null } })
      : colis.client;
  if (!nouveauClient) throw new PricingError('Client introuvable.', 404);

  const description = input.description ?? colis.description;
  const poidsReelKg = input.poidsReelKg ?? Number(colis.poidsReelKg);
  const longueurCm = input.longueurCm !== undefined ? input.longueurCm : num(colis.longueurCm);
  const largeurCm = input.largeurCm !== undefined ? input.largeurCm : num(colis.largeurCm);
  const hauteurCm = input.hauteurCm !== undefined ? input.hauteurCm : num(colis.hauteurCm);
  const dateReception = input.dateReception !== undefined ? input.dateReception : colis.dateReception;
  const categorieTarif = input.categorieTarif ?? colis.categorieTarif;

  const poidsVolumetriqueKg =
    longueurCm && largeurCm && hauteurCm ? computeVolumetricWeightKg(longueurCm, largeurCm, hauteurCm, divisor) : 0;
  const poidsTaxableKg = computeTaxableWeightKg(poidsReelKg, poidsVolumetriqueKg);
  const poidsFacture = billingMode === 'poids_taxable' ? poidsTaxableKg : poidsReelKg;

  // Prix au kilo effectivement appliqué jusqu'ici (tient compte d'une éventuelle correction de
  // prix déjà faite) : il est conservé tant que la catégorie et le prix négocié ne changent pas,
  // pour qu'une correction de poids ne réapplique pas le tarif du jour.
  const poidsFactureAvant = billingMode === 'poids_taxable' ? Number(colis.poidsTaxableKg) : Number(colis.poidsReelKg);
  const prixKgAvant = poidsFactureAvant > 0 ? arrondi2(Number(colis.montantEstime) / poidsFactureAvant) : 0;

  let prixKg = prixKgAvant;
  let pricingRuleId = colis.pricingRuleId;
  const categorieChange = categorieTarif !== colis.categorieTarif;
  const prixNegocieChange =
    categorieTarif === 'GROS_VOLUME' && input.tarifManuelParKg !== undefined && input.tarifManuelParKg !== prixKgAvant;

  if (categorieChange || prixNegocieChange) {
    if (categorieTarif === 'GROS_VOLUME') {
      if (!input.tarifManuelParKg) throw new PricingError('Indiquez le prix négocié au kilo pour le tarif Gros volume.');
      const standard = await getActivePricingRule('STANDARD');
      if (input.tarifManuelParKg > Number(standard.pricePerKg)) {
        throw new PricingError(
          `Le prix Gros volume ne peut pas dépasser le tarif Standard (${Number(standard.pricePerKg)} ${standard.currency}/kg).`,
        );
      }
      prixKg = input.tarifManuelParKg;
      pricingRuleId = standard.id;
    } else if (categorieTarif === 'STANDARD' || categorieTarif === 'RISQUE') {
      const regle = await getActivePricingRule(categorieTarif);
      prixKg = Number(regle.pricePerKg);
      pricingRuleId = regle.id;
    }
  }

  const prixAffecte =
    categorieChange ||
    prixNegocieChange ||
    poidsReelKg !== Number(colis.poidsReelKg) ||
    longueurCm !== num(colis.longueurCm) ||
    largeurCm !== num(colis.largeurCm) ||
    hauteurCm !== num(colis.hauteurCm);
  const ancienMontant = Number(colis.montantEstime);
  const montantEstime = prixAffecte ? arrondi2(poidsFacture * prixKg) : ancienMontant;

  const clientLibelle = (c: { fullName: string; clientCode: string }) => `${c.fullName} (${c.clientCode})`;
  const changements = comparer(
    {
      client: clientLibelle(colis.client),
      description: colis.description,
      poidsReelKg: Number(colis.poidsReelKg),
      longueurCm: num(colis.longueurCm),
      largeurCm: num(colis.largeurCm),
      hauteurCm: num(colis.hauteurCm),
      categorieTarif: colis.categorieTarif,
      prixKg: prixKgAvant,
      montantEstime: ancienMontant,
      dateReception: colis.dateReception?.toISOString() ?? null,
    },
    {
      client: clientLibelle(nouveauClient),
      description,
      poidsReelKg,
      longueurCm,
      largeurCm,
      hauteurCm,
      categorieTarif,
      prixKg,
      montantEstime,
      dateReception: dateReception?.toISOString() ?? null,
    },
  );
  if (changements.length === 0) throw new PricingError('Aucune modification à enregistrer.');

  // Verrous : après un paiement, seuls la description et la date restent modifiables ; une fois
  // facturé, le colis ne change plus de client (la facture et le solde sont à son nom).
  const paye = (colis.facture?.paiements.length ?? 0) > 0;
  if (paye && changements.some((c) => CHAMPS_PRIX.includes(c.champ))) {
    throw new PricingError(
      'Un paiement a déjà été enregistré sur ce colis : seules la description et la date de réception peuvent encore être modifiées.',
      409,
    );
  }
  if (colis.facture && nouveauClient.id !== colis.clientId) {
    throw new PricingError(
      `Ce colis est déjà sur la facture ${colis.facture.factureNumber} : son client ne peut plus être changé.`,
      409,
    );
  }

  const delta = montantEstime - ancienMontant;

  return prisma.$transaction(async (tx) => {
    await tx.colis.update({
      where: { id: colis.id },
      data: {
        clientId: nouveauClient.id,
        description,
        poidsReelKg,
        longueurCm,
        largeurCm,
        hauteurCm,
        poidsVolumetriqueKg,
        poidsTaxableKg,
        categorieTarif,
        pricingRuleId,
        montantEstime,
        dateReception,
      },
    });

    // Même ajustement que updateColisPrice : la facture (non payée) et le solde du client
    // suivent le nouveau montant
    if (colis.factureId && delta !== 0) {
      await tx.facture.update({ where: { id: colis.factureId }, data: { montantTotal: { increment: delta } } });
      await tx.client.update({ where: { id: colis.clientId }, data: { outstandingBalance: { increment: delta } } });
    }

    await tx.auditLog.create({
      data: {
        userId,
        action: 'colis:modifie',
        entityType: 'Colis',
        entityId: colis.id,
        reason: input.motif,
        metadata: { trackingId, currency: colis.currency, changements: changements as never },
      },
    });

    return tx.colis.findUniqueOrThrow({
      where: { id: colis.id },
      include: { client: true, facture: { include: { paiements: { where: { deletedAt: null } } } } },
    });
  });
}

// ── Historique ───────────────────────────────────────────────────────────────────────────

const LIBELLES_ACTIONS: Record<string, string> = {
  'colis:cree': 'Enregistrement du colis',
  'colis:modifie': 'Modification des informations',
  'colis:prix_modifie': 'Modification du prix',
  'colis:statut_modifie': 'Changement de statut',
  'colis:livre': 'Remise au client',
  'colis:ecart_poids_signale': 'Écart de poids signalé',
  'colis:ecart_poids_resolu': 'Écart de poids résolu',
};

type Meta = Record<string, unknown> | null;

// Changements avant → après d'une entrée du journal, quel que soit le type d'action
function changementsDe(action: string, meta: Meta): Changement[] {
  if (!meta) return [];
  if (action === 'colis:modifie' && Array.isArray(meta.changements)) return meta.changements as Changement[];
  if (action === 'colis:prix_modifie') {
    return [
      { champ: 'montantEstime', libelle: 'Montant', avant: num(meta.ancienMontant), apres: num(meta.nouveauMontant) },
    ];
  }
  if (action === 'colis:statut_modifie') {
    return [
      {
        champ: 'status',
        libelle: 'Statut',
        avant: (meta.ancienStatut as string) ?? null,
        apres: (meta.nouveauStatut as string) ?? null,
      },
    ];
  }
  return [];
}

export async function listHistoriqueColis(trackingId: string) {
  const colis = await prisma.colis.findFirst({ where: { trackingId, deletedAt: null }, select: { id: true } });
  if (!colis) throw new PricingError('Colis introuvable.', 404);

  const logs = await prisma.auditLog.findMany({
    where: { entityType: 'Colis', entityId: colis.id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { fullName: true, role: { select: { roleName: true } } } } },
  });

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    libelle: LIBELLES_ACTIONS[l.action] ?? l.action,
    date: l.createdAt,
    auteur: l.user?.fullName ?? 'Système',
    role: l.user?.role?.roleName ?? null,
    motif: l.reason,
    changements: changementsDe(l.action, l.metadata as Meta),
  }));
}
