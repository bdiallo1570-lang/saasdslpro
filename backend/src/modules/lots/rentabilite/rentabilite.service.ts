import { prisma } from '@/lib/prisma';
import { getSousTotauxParCategorie } from '../depenses/depenseLot.service';
import { AppError } from '@/lib/errors';

export class RentabiliteError extends AppError {}

// Compte de résultat d'un lot pris indépendamment (règle structurante du module Agent Guinée :
// chaque lot est une unité économique autonome). Tous les montants sont convertis en GNF.
export async function getRentabiliteLot(lotId: string) {
  const lot = await prisma.lot.findFirst({ where: { id: lotId, deletedAt: null } });
  if (!lot) throw new RentabiliteError('Lot introuvable.', 404);

  const colisDuLot = await prisma.colis.findMany({
    where: { lotId, deletedAt: null },
    include: { facture: { include: { paiements: { where: { deletedAt: null } } } } },
  });

  // CA facturé = somme des montants de facture (déjà en GNF si devise GNF, sinon convertis
  // au taux du premier paiement figé — cohérent avec computePaiementColis du presenter).
  let caFactureGnf = 0;
  let encaissementsGnf = 0;
  for (const c of colisDuLot) {
    if (!c.facture) continue;
    const referenceTaux = c.facture.paiements[0] ? Number(c.facture.paiements[0].tauxVersGnf) : 1;
    caFactureGnf +=
      c.facture.currency === 'GNF' ? Number(c.facture.montantTotal) : Number(c.facture.montantTotal) * referenceTaux;
    encaissementsGnf += c.facture.paiements.reduce(
      (sum, p) => sum + Number(p.montant) * Number(p.tauxVersGnf),
      0,
    );
  }
  const creancesEnCoursGnf = Math.max(0, caFactureGnf - encaissementsGnf);

  const depensesParCategorie = await getSousTotauxParCategorie(lotId);
  const totalDepensesGnf = depensesParCategorie.reduce((sum, d) => sum + d.totalGnf, 0);

  const margeBruteGnf = caFactureGnf - totalDepensesGnf;
  const margeEncaisseeGnf = encaissementsGnf - totalDepensesGnf;
  const tauxMargePourcent = caFactureGnf > 0 ? (margeBruteGnf / caFactureGnf) * 100 : 0;

  const poidsTaxableTotalKg = colisDuLot.reduce((sum, c) => sum + Number(c.poidsTaxableKg), 0);
  const coutRevientParKgGnf = poidsTaxableTotalKg > 0 ? totalDepensesGnf / poidsTaxableTotalKg : 0;
  const margeParKgGnf = poidsTaxableTotalKg > 0 ? margeBruteGnf / poidsTaxableTotalKg : 0;

  return {
    lotNumber: lot.lotNumber,
    revenus: { caFactureGnf, encaissementsGnf, creancesEnCoursGnf },
    depenses: { parCategorie: depensesParCategorie, totalGnf: totalDepensesGnf },
    resultats: {
      margeBruteGnf,
      margeEncaisseeGnf,
      tauxMargePourcent,
      coutRevientParKgGnf,
      margeParKgGnf,
      poidsTaxableTotalKg,
    },
  };
}

export type RentabiliteLot = Awaited<ReturnType<typeof getRentabiliteLot>>;
