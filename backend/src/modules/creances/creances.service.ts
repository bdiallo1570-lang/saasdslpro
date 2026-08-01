import { prisma } from '@/lib/prisma';

// Ancienneté d'une créance = jours écoulés depuis la création de la facture impayée
// la plus ancienne du client. Seuils règle métier : < 7j, 8-30j, > 30j (rouge).
export type RiskTier = 'FAIBLE' | 'MOYEN' | 'ELEVE';

function computeRiskTier(ageDays: number): RiskTier {
  if (ageDays <= 7) return 'FAIBLE';
  if (ageDays <= 30) return 'MOYEN';
  return 'ELEVE';
}

export async function getCreancesKpis() {
  const facturesImpayees = await prisma.facture.findMany({
    where: { status: { in: ['IMPAYE', 'PARTIEL'] }, deletedAt: null },
    include: { client: true, paiements: { where: { deletedAt: null } } },
  });

  const totalCreances = facturesImpayees.reduce((sum, f) => {
    const paye = f.paiements.reduce((s, p) => s + Number(p.montant) * Number(p.tauxVersGnf), 0);
    return sum + Math.max(Number(f.montantTotal) - paye, 0);
  }, 0);

  const clientsARisque = new Set(
    facturesImpayees
      .filter((f) => {
        const ageDays = Math.floor((Date.now() - f.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return computeRiskTier(ageDays) === 'ELEVE';
      })
      .map((f) => f.clientId),
  ).size;

  const paiementsPartiels = facturesImpayees.filter((f) => f.status === 'PARTIEL').length;

  return {
    totalCreances,
    clientsARisque,
    paiementsPartiels,
    nombreFacturesImpayees: facturesImpayees.length,
  };
}

export async function listClientsDebiteurs() {
  const facturesImpayees = await prisma.facture.findMany({
    where: { status: { in: ['IMPAYE', 'PARTIEL'] }, deletedAt: null },
    include: { client: true, paiements: { where: { deletedAt: null } } },
    orderBy: { createdAt: 'asc' },
  });

  const byClient = new Map<
    string,
    {
      client: (typeof facturesImpayees)[number]['client'];
      soldeDu: number;
      ancienneteJours: number;
      nombreFactures: number;
      aPaiementPartiel: boolean;
    }
  >();

  for (const f of facturesImpayees) {
    const paye = f.paiements.reduce((s, p) => s + Number(p.montant) * Number(p.tauxVersGnf), 0);
    const soldeDu = Math.max(Number(f.montantTotal) - paye, 0);
    const ageDays = Math.floor((Date.now() - f.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    const existing = byClient.get(f.clientId);
    if (existing) {
      existing.soldeDu += soldeDu;
      existing.ancienneteJours = Math.max(existing.ancienneteJours, ageDays);
      existing.nombreFactures += 1;
      existing.aPaiementPartiel = existing.aPaiementPartiel || f.status === 'PARTIEL';
    } else {
      byClient.set(f.clientId, {
        client: f.client,
        soldeDu,
        ancienneteJours: ageDays,
        nombreFactures: 1,
        aPaiementPartiel: f.status === 'PARTIEL',
      });
    }
  }

  return Array.from(byClient.values())
    .map((entry) => ({
      client: {
        id: entry.client.id,
        clientCode: entry.client.clientCode,
        fullName: entry.client.fullName,
        phoneGn: entry.client.phoneGn,
        phoneWhatsapp: entry.client.phoneWhatsapp,
      },
      soldeDu: entry.soldeDu,
      ancienneteJours: entry.ancienneteJours,
      nombreFactures: entry.nombreFactures,
      aPaiementPartiel: entry.aPaiementPartiel,
      niveauRisque: computeRiskTier(entry.ancienneteJours),
    }))
    .sort((a, b) => b.ancienneteJours - a.ancienneteJours);
}
