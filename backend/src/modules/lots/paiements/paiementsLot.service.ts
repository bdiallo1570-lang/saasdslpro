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
