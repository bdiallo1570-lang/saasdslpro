import { prisma } from '@/lib/prisma';
import { getSeuilsAlertes } from '@/lib/settings';

// Ancienneté d'une créance = jours écoulés depuis la création de la facture impayée
// la plus ancienne du client. Seuil "risque élevé" configurable (jours_avant_alerte_creance,
// défaut 7j) — le palier "moyen" reste fixé à 30j (pas de Setting dédié demandé pour celui-ci).
export type RiskTier = 'FAIBLE' | 'MOYEN' | 'ELEVE';

function computeRiskTier(ageDays: number, seuilJours: number): RiskTier {
  if (ageDays <= seuilJours) return 'FAIBLE';
  if (ageDays <= 30) return 'MOYEN';
  return 'ELEVE';
}

export async function getCreancesKpis() {
  const seuils = await getSeuilsAlertes();
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
        return computeRiskTier(ageDays, seuils.joursAvantAlerteCreance) === 'ELEVE';
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
  const seuils = await getSeuilsAlertes();
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
      montantPayeTotal: number;
      ancienneteJours: number;
      // Avec la facturation auto 1 colis = 1 facture, une facture impayée = un colis en attente.
      nombreColisEnAttente: number;
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
      existing.montantPayeTotal += paye;
      existing.ancienneteJours = Math.max(existing.ancienneteJours, ageDays);
      existing.nombreColisEnAttente += 1;
      existing.aPaiementPartiel = existing.aPaiementPartiel || f.status === 'PARTIEL';
    } else {
      byClient.set(f.clientId, {
        client: f.client,
        soldeDu,
        montantPayeTotal: paye,
        ancienneteJours: ageDays,
        nombreColisEnAttente: 1,
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
        telephone: entry.client.phoneWhatsapp ?? entry.client.phoneGn,
      },
      soldeDu: entry.soldeDu,
      montantPayeTotal: entry.montantPayeTotal,
      ancienneteJours: entry.ancienneteJours,
      nombreColisEnAttente: entry.nombreColisEnAttente,
      aPaiementPartiel: entry.aPaiementPartiel,
      niveauRisque: computeRiskTier(entry.ancienneteJours, seuils.joursAvantAlerteCreance),
    }))
    .sort((a, b) => b.soldeDu - a.soldeDu);
}
