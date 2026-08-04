import { prisma } from '@/lib/prisma';

// Statuts colis considérés "en transit" (pas encore livrés).
const STATUTS_EN_TRANSIT = [
  'ENREGISTRE',
  'ASSIGNE_LOT',
  'ENVOLE',
  'ARRIVE',
  'EN_DEDOUANEMENT',
  'DISPONIBLE_ENTREPOT',
] as const;

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Vue d'ensemble transversale de l'activité — pièce centrale du Dashboard Financier Admin.
// Agrège des données déjà réelles dans plusieurs modules (colis, lots, caisse, créances)
// qui n'étaient jusqu'ici visibles que séparément dans leurs modules respectifs.
export async function getDashboardOverview() {
  const today = startOfDay(new Date());

  const [
    colisEnTransitCount,
    colisLivresAujourdhui,
    lotsActifs,
    facturesPayees,
    facturesImpayees,
    caissesOuvertesAujourdhui,
    dernierColis,
    dernierLot,
    colisParStatutBrut,
  ] = await Promise.all([
    prisma.colis.count({
      where: { status: { in: [...STATUTS_EN_TRANSIT] }, deletedAt: null },
    }),
    prisma.colis.count({
      where: { status: 'LIVRE', deletedAt: null, updatedAt: { gte: today } },
    }),
    prisma.lot.count({
      where: { status: { not: 'CLOTURE' }, deletedAt: null },
    }),
    prisma.facture.findMany({
      where: { status: 'PAYE', deletedAt: null },
      include: { paiements: { where: { deletedAt: null } } },
    }),
    prisma.facture.findMany({
      where: { status: { in: ['IMPAYE', 'PARTIEL'] }, deletedAt: null },
      include: { paiements: { where: { deletedAt: null } } },
    }),
    prisma.cashRegisterClosure.findMany({
      where: { date: today },
      include: { transactions: { where: { deletedAt: null } } },
    }),
    prisma.colis.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { client: true },
    }),
    prisma.lot.findFirst({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.colis.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    }),
  ]);

  // Compteur par statut technique — alimente les pills de filtre du Dashboard Financier
  // (regroupées côté frontend en 4 catégories : en attente / en vol / en douane / livré).
  const colisParStatut = Object.fromEntries(
    colisParStatutBrut.map((g) => [g.status, g._count]),
  ) as Partial<Record<string, number>>;

  // CA encaissé = somme des paiements réels (convertis en GNF au taux figé de chaque paiement).
  const caEncaisse = facturesPayees.reduce(
    (sum, f) => sum + f.paiements.reduce((s, p) => s + Number(p.montant) * Number(p.tauxVersGnf), 0),
    0,
  );

  const totalImpayes = facturesImpayees.reduce((sum, f) => {
    const paye = f.paiements.reduce((s, p) => s + Number(p.montant) * Number(p.tauxVersGnf), 0);
    return sum + Math.max(Number(f.montantTotal) - paye, 0);
  }, 0);

  // Solde de caisse théorique cumulé, toutes agences/devises ouvertes aujourd'hui (converti en GNF
  // uniquement pour les caisses en GNF — les autres devises sont additionnées séparément si présentes).
  const caisseDuJourGnf = caissesOuvertesAujourdhui
    .filter((c) => c.currency === 'GNF')
    .reduce((sum, c) => {
      const entrees = c.transactions
        .filter((t) => t.type === 'ENTREE')
        .reduce((s, t) => s + Number(t.montant), 0);
      const depenses = c.transactions
        .filter((t) => t.type === 'DEPENSE')
        .reduce((s, t) => s + Number(t.montant), 0);
      return sum + Number(c.fondOuverture) + entrees - depenses;
    }, 0);

  const nombreCaissesOuvertes = caissesOuvertesAujourdhui.filter((c) => c.status === 'OUVERTE').length;

  return {
    colisEnTransit: colisEnTransitCount,
    colisLivresAujourdhui,
    lotsActifs,
    caEncaisse,
    totalImpayes,
    nombreFacturesImpayees: facturesImpayees.length,
    caisseDuJourGnf,
    nombreCaissesOuvertes,
    colisParStatut,
    derniereActivite: {
      dernierColis: dernierColis
        ? {
            trackingId: dernierColis.trackingId,
            clientNom: dernierColis.client.fullName,
            status: dernierColis.status,
            createdAt: dernierColis.createdAt,
          }
        : null,
      dernierLot: dernierLot
        ? {
            lotNumber: dernierLot.lotNumber,
            status: dernierLot.status,
            updatedAt: dernierLot.updatedAt,
          }
        : null,
    },
  };
}
