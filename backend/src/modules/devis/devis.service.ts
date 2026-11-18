import { DevisStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { nextSequenceNumber } from '@/lib/sequence';
import { getCurrentRateToGnf } from '@/lib/exchangeRate';
import { getPrixMaritimeUsdM3 } from '@/lib/settings';
import { calculerLignes, calculerTotaux, DevisCalculError, estExpire, Tarifs } from './devis.calcul';
import { DevisInput } from './devis.schema';

export class DevisError extends AppError {}

const VALIDITE_JOURS = 15;
// Modifiable tant que le client n'a pas répondu
const MODIFIABLE: DevisStatus[] = ['BROUILLON', 'ENVOYE'];

const include = {
  client: true,
  lignes: { orderBy: { ordre: 'asc' } },
} satisfies Prisma.DevisInclude;

type DevisComplet = Prisma.DevisGetPayload<{ include: typeof include }>;

// Tarifs à appliquer : prix au kilo actifs, prix maritime au m³, et taux USD → GNF (celui figé sur
// le devis s'il existe, sinon le taux du jour ; null si aucun taux n'est configuré).
export async function getTarifs(tauxFige?: number | null): Promise<Tarifs> {
  const [standard, sensible, maritime] = await Promise.all([
    prisma.pricingRule.findFirst({ where: { categoryName: 'STANDARD', isActive: true }, orderBy: { effectiveFrom: 'desc' } }),
    prisma.pricingRule.findFirst({ where: { categoryName: 'RISQUE', isActive: true }, orderBy: { effectiveFrom: 'desc' } }),
    getPrixMaritimeUsdM3(),
  ]);
  let taux = tauxFige ?? null;
  if (!taux) taux = await getCurrentRateToGnf('USD').catch(() => null);
  return {
    standardGnfKg: standard ? Number(standard.pricePerKg) : null,
    sensibleGnfKg: sensible ? Number(sensible.pricePerKg) : null,
    maritimeUsdM3: maritime,
    tauxUsdGnf: taux,
  };
}

export function serializeDevis(d: DevisComplet) {
  return {
    id: d.id,
    numero: d.devisNumber,
    numeroProforma: d.devisNumber.replace(/^DEV-/, 'PF-'),
    status: d.status,
    expire: estExpire(d.status, d.validUntil),
    validUntil: d.validUntil,
    tauxUsdGnf: d.tauxUsdGnf === null ? null : Number(d.tauxUsdGnf),
    sousTotal: Number(d.sousTotal),
    remise: Number(d.remise),
    total: Number(d.total),
    note: d.note,
    createdAt: d.createdAt,
    client: {
      id: d.client.id,
      nom: d.client.fullName,
      code: d.client.clientCode,
      telephone: d.client.phoneWhatsapp || d.client.phoneGn || null,
    },
    lignes: d.lignes.map((l) => ({
      type: l.type,
      libelle: l.libelle,
      quantite: Number(l.quantite),
      unite: l.unite,
      prixUnitaireUsd: l.prixUnitaireUsd === null ? null : Number(l.prixUnitaireUsd),
      prixUnitaire: Number(l.prixUnitaire),
      montant: Number(l.montant),
    })),
  };
}

export type DevisDto = ReturnType<typeof serializeDevis>;

async function chiffrer(input: DevisInput, tauxFige: number | null) {
  const tarifs = await getTarifs(tauxFige);
  try {
    const lignes = calculerLignes(input.lignes, tarifs);
    const totaux = calculerTotaux(lignes, input.remise);
    const aMaritime = lignes.some((l) => l.type === 'MARITIME');
    return { lignes, totaux, taux: aMaritime ? tarifs.tauxUsdGnf : tauxFige };
  } catch (error) {
    if (error instanceof DevisCalculError) throw new DevisError(error.message);
    throw error;
  }
}

async function verifierClient(clientId: string) {
  const client = await prisma.client.findFirst({ where: { id: clientId, deletedAt: null } });
  if (!client) throw new DevisError('Client introuvable.', 404);
}

function dateValidite(input: DevisInput): Date {
  if (input.validUntil) return input.validUntil;
  const d = new Date();
  d.setDate(d.getDate() + VALIDITE_JOURS);
  d.setHours(23, 59, 59, 0);
  return d;
}

export async function getDevis(id: string): Promise<DevisComplet> {
  const devis = await prisma.devis.findFirst({ where: { id, deletedAt: null }, include });
  if (!devis) throw new DevisError('Devis introuvable.', 404);
  return devis;
}

export async function listDevis(params: { q?: string; statut?: string }) {
  const q = params.q?.trim();
  const where: Prisma.DevisWhereInput = { deletedAt: null };
  if (q) {
    where.OR = [
      { devisNumber: { contains: q.replace(/^PF-/i, 'DEV-'), mode: 'insensitive' } },
      { client: { fullName: { contains: q, mode: 'insensitive' } } },
      { client: { clientCode: { contains: q, mode: 'insensitive' } } },
    ];
  }
  const now = new Date();
  if (params.statut === 'EXPIRE') {
    where.status = { in: ['BROUILLON', 'ENVOYE'] };
    where.validUntil = { lt: now };
  } else if (params.statut && ['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE'].includes(params.statut)) {
    where.status = params.statut as DevisStatus;
    if (params.statut === 'BROUILLON' || params.statut === 'ENVOYE') where.validUntil = { gte: now };
  }
  const devis = await prisma.devis.findMany({ where, include, orderBy: { createdAt: 'desc' }, take: 200 });
  return devis.map(serializeDevis);
}

export async function createDevis(input: DevisInput, userId: string) {
  await verifierClient(input.clientId);
  const { lignes, totaux, taux } = await chiffrer(input, null);
  const devis = await prisma.$transaction(async (tx) => {
    const devisNumber = await nextSequenceNumber(tx, 'DEVIS', 'DEV');
    return tx.devis.create({
      data: {
        devisNumber,
        clientId: input.clientId,
        validUntil: dateValidite(input),
        tauxUsdGnf: taux,
        ...totaux,
        note: input.note || null,
        createdById: userId,
        lignes: { create: lignes },
      },
      include,
    });
  });
  return serializeDevis(devis);
}

export async function updateDevis(id: string, input: DevisInput) {
  const existant = await getDevis(id);
  if (!MODIFIABLE.includes(existant.status)) {
    throw new DevisError('Ce devis a déjà reçu une réponse du client : il ne peut plus être modifié.');
  }
  await verifierClient(input.clientId);
  // Le taux reste celui figé à la création du devis (s'il en avait un)
  const { lignes, totaux, taux } = await chiffrer(input, existant.tauxUsdGnf === null ? null : Number(existant.tauxUsdGnf));
  const devis = await prisma.$transaction(async (tx) => {
    await tx.devisLigne.deleteMany({ where: { devisId: id } });
    return tx.devis.update({
      where: { id },
      data: {
        clientId: input.clientId,
        validUntil: dateValidite(input),
        tauxUsdGnf: taux,
        ...totaux,
        note: input.note || null,
        lignes: { create: lignes },
      },
      include,
    });
  });
  return serializeDevis(devis);
}

export async function setStatut(id: string, status: DevisStatus) {
  await getDevis(id);
  const devis = await prisma.devis.update({ where: { id }, data: { status }, include });
  return serializeDevis(devis);
}

export async function deleteDevis(id: string) {
  const devis = await getDevis(id);
  if (devis.status !== 'BROUILLON') {
    throw new DevisError('Seul un brouillon peut être supprimé. Marquez plutôt le devis comme refusé.');
  }
  await prisma.devis.update({ where: { id }, data: { deletedAt: new Date() } });
}
