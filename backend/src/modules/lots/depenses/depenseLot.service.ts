import { CategorieDepenseLot } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CreateDepenseInput } from './depenseLot.schema';

export class DepenseLotError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

const VINGT_QUATRE_HEURES_MS = 24 * 60 * 60 * 1000;

// Toutes les catégories, dans l'ordre d'affichage métier (Dédouanement et Transport
// aéroport→Madina en premier — les deux postes prioritaires du module Agent Guinée).
export const CATEGORIES_ORDONNEES: CategorieDepenseLot[] = [
  'DEDOUANEMENT',
  'TRANSPORT_AEROPORT_MADINA',
  'MANUTENTION',
  'STOCKAGE',
  'DOCUMENTATION',
  'DIVERS',
];

// Chaque lot est une unité économique autonome (règle structurante du module) — toute
// dépense est obligatoirement rattachée à un lotId, jamais mutualisée entre deux lots.
// montantGnf est calculé ici, côté backend uniquement, jamais confié au frontend.
export async function createDepense(lotId: string, input: CreateDepenseInput, userId: string) {
  const lot = await prisma.lot.findFirst({ where: { id: lotId, deletedAt: null } });
  if (!lot) throw new DepenseLotError('Lot introuvable.', 404);

  const tauxVersGnf = input.currency === 'GNF' ? 1 : input.tauxVersGnf!;
  const montantGnf = input.montant * tauxVersGnf;

  return prisma.$transaction(async (tx) => {
    const depense = await tx.depenseLot.create({
      data: {
        lotId,
        categorie: input.categorie,
        libelle: input.libelle,
        montant: input.montant,
        currency: input.currency,
        tauxVersGnf,
        montantGnf,
        dateDepense: input.dateDepense,
        beneficiaire: input.beneficiaire ?? null,
        referenceRecu: input.referenceRecu ?? null,
        justificatifUrl: input.justificatifUrl ?? null,
        saisiParUserId: userId,
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'depense_lot:creee',
        entityType: 'DepenseLot',
        entityId: depense.id,
        metadata: { lotId, categorie: input.categorie, montantGnf },
      },
    });

    return depense;
  });
}

export async function listDepensesByLot(
  lotId: string,
  filters?: { categorie?: CategorieDepenseLot; dateDebut?: Date; dateFin?: Date },
) {
  return prisma.depenseLot.findMany({
    where: {
      lotId,
      deletedAt: null,
      ...(filters?.categorie ? { categorie: filters.categorie } : {}),
      ...(filters?.dateDebut || filters?.dateFin
        ? {
            dateDepense: {
              ...(filters?.dateDebut ? { gte: filters.dateDebut } : {}),
              ...(filters?.dateFin ? { lte: filters.dateFin } : {}),
            },
          }
        : {}),
    },
    orderBy: { dateDepense: 'desc' },
  });
}

// Sous-totaux par catégorie pour ce lot uniquement — toutes les catégories sont présentes
// dans le résultat (0 si absente), Dédouanement et Transport en premier.
export async function getSousTotauxParCategorie(lotId: string) {
  const groupes = await prisma.depenseLot.groupBy({
    by: ['categorie'],
    where: { lotId, deletedAt: null },
    _sum: { montantGnf: true },
  });

  const totauxParCategorie = new Map(groupes.map((g) => [g.categorie, Number(g._sum.montantGnf ?? 0)]));

  return CATEGORIES_ORDONNEES.map((categorie) => ({
    categorie,
    totalGnf: totauxParCategorie.get(categorie) ?? 0,
  }));
}

export async function updateDepense(
  id: string,
  input: CreateDepenseInput,
  userId: string,
  roleName: string,
) {
  const depense = await prisma.depenseLot.findFirst({ where: { id, deletedAt: null } });
  if (!depense) throw new DepenseLotError('Dépense introuvable.', 404);

  // Agent Guinée : modification limitée à 24h après création (règle permissions). Admin : sans limite.
  if (roleName !== 'Admin') {
    const ageMs = Date.now() - depense.createdAt.getTime();
    if (ageMs > VINGT_QUATRE_HEURES_MS) {
      throw new DepenseLotError(
        'Cette dépense a été créée il y a plus de 24h — seul un Admin peut encore la modifier.',
        403,
      );
    }
  }

  const tauxVersGnf = input.currency === 'GNF' ? 1 : input.tauxVersGnf!;
  const montantGnf = input.montant * tauxVersGnf;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.depenseLot.update({
      where: { id },
      data: {
        categorie: input.categorie,
        libelle: input.libelle,
        montant: input.montant,
        currency: input.currency,
        tauxVersGnf,
        montantGnf,
        dateDepense: input.dateDepense,
        beneficiaire: input.beneficiaire ?? null,
        referenceRecu: input.referenceRecu ?? null,
        justificatifUrl: input.justificatifUrl ?? null,
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'depense_lot:modifiee',
        entityType: 'DepenseLot',
        entityId: id,
        metadata: { lotId: depense.lotId, ancienMontantGnf: Number(depense.montantGnf), nouveauMontantGnf: montantGnf },
      },
    });

    return updated;
  });
}

// Soft delete uniquement — jamais de suppression physique d'une dépense (règle 6, traçabilité).
export async function softDeleteDepense(id: string, userId: string, motif: string) {
  const depense = await prisma.depenseLot.findFirst({ where: { id, deletedAt: null } });
  if (!depense) throw new DepenseLotError('Dépense introuvable.', 404);

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.depenseLot.update({ where: { id }, data: { deletedAt: new Date() } });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'depense_lot:supprimee',
        entityType: 'DepenseLot',
        entityId: id,
        reason: motif,
        metadata: { lotId: depense.lotId, montantGnf: Number(depense.montantGnf) },
      },
    });

    return deleted;
  });
}
