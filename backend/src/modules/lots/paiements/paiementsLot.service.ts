import { prisma } from '@/lib/prisma';
import { computePaiementColis } from '@/modules/colis/colis.presenter';

export async function listPaiementsByLot(lotId: string) {
  return prisma.paiement.findMany({
    where: { facture: { colis: { some: { lotId, deletedAt: null } } }, deletedAt: null },
    include: { facture: { include: { colis: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

// Vue accordéon par client (onglet "Paiements clients") : pour chaque client du lot, ses colis
// avec dû/payé/reste, et l'agrégat client. Réutilise computePaiementColis (source de vérité
// unique du calcul de solde, partagée avec le presenter colis et la rentabilité).
export async function getPaiementsParClient(lotId: string) {
  const colisDuLot = await prisma.colis.findMany({
    where: { lotId, deletedAt: null },
    include: {
      client: true,
      facture: { include: { paiements: { where: { deletedAt: null } } } },
    },
    orderBy: { trackingId: 'asc' },
  });

  const byClient = new Map<
    string,
    {
      client: { id: string; clientCode: string; fullName: string; phoneGn: string | null; phoneWhatsapp: string | null };
      dûGnf: number;
      payéGnf: number;
      resteGnf: number;
      colis: {
        trackingId: string;
        colisId: string;
        dûGnf: number;
        payéGnf: number;
        resteGnf: number;
        statutPaiement: string;
      }[];
    }
  >();

  for (const c of colisDuLot) {
    const { montantDuGnf, montantPayeGnf, resteAPayerGnf, statutPaiement } = computePaiementColis(c.facture);

    const entry = byClient.get(c.clientId) ?? {
      client: {
        id: c.client.id,
        clientCode: c.client.clientCode,
        fullName: c.client.fullName,
        phoneGn: c.client.phoneGn,
        phoneWhatsapp: c.client.phoneWhatsapp,
      },
      dûGnf: 0,
      payéGnf: 0,
      resteGnf: 0,
      colis: [],
    };

    entry.dûGnf += montantDuGnf;
    entry.payéGnf += montantPayeGnf;
    entry.resteGnf += resteAPayerGnf;
    entry.colis.push({
      trackingId: c.trackingId,
      colisId: c.id,
      dûGnf: montantDuGnf,
      payéGnf: montantPayeGnf,
      resteGnf: resteAPayerGnf,
      statutPaiement,
    });

    byClient.set(c.clientId, entry);
  }

  return Array.from(byClient.values()).sort((a, b) => b.resteGnf - a.resteGnf);
}

// Vue globale "Caisse Madina" (onglet principal Agent Guinée) : tous les colis facturés,
// groupés par lot, avec leurs infos comptables (dû/payé/reste). `solde` est vrai quand chaque
// colis du lot est SOLDE ou TROP_PERCU (reste à payer nul) — sert au badge vert "lot traité".
// Réutilise computePaiementColis (même source de vérité que getPaiementsParClient/presentColis).
export async function getPaiementsParLot() {
  const colis = await prisma.colis.findMany({
    where: { deletedAt: null, lotId: { not: null }, factureId: { not: null } },
    include: {
      client: true,
      lot: true,
      facture: { include: { paiements: { where: { deletedAt: null } } } },
    },
    orderBy: { trackingId: 'asc' },
  });

  const byLot = new Map<
    string,
    {
      lot: { id: string; lotNumber: string; flightNumber: string | null; status: string };
      dûGnf: number;
      payéGnf: number;
      resteGnf: number;
      solde: boolean;
      colis: {
        colisId: string;
        trackingId: string;
        client: { id: string; fullName: string };
        dûGnf: number;
        payéGnf: number;
        resteGnf: number;
        statutPaiement: string;
      }[];
    }
  >();

  for (const c of colis) {
    if (!c.lot) continue;
    const { montantDuGnf, montantPayeGnf, resteAPayerGnf, statutPaiement } = computePaiementColis(c.facture);

    const entry = byLot.get(c.lot.id) ?? {
      lot: {
        id: c.lot.id,
        lotNumber: c.lot.lotNumber,
        flightNumber: c.lot.flightNumber,
        status: c.lot.status,
      },
      dûGnf: 0,
      payéGnf: 0,
      resteGnf: 0,
      solde: true,
      colis: [],
    };

    entry.dûGnf += montantDuGnf;
    entry.payéGnf += montantPayeGnf;
    entry.resteGnf += resteAPayerGnf;
    if (resteAPayerGnf > 0) entry.solde = false;
    entry.colis.push({
      colisId: c.id,
      trackingId: c.trackingId,
      client: { id: c.client.id, fullName: c.client.fullName },
      dûGnf: montantDuGnf,
      payéGnf: montantPayeGnf,
      resteGnf: resteAPayerGnf,
      statutPaiement,
    });

    byLot.set(c.lot.id, entry);
  }

  // Lots non soldés en premier (ce qu'il reste à régler), lots traités relégués en fin de liste.
  return Array.from(byLot.values()).sort((a, b) => {
    if (a.solde !== b.solde) return a.solde ? 1 : -1;
    return b.resteGnf - a.resteGnf;
  });
}
