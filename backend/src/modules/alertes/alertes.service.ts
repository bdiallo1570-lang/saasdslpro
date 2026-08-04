import { prisma } from '@/lib/prisma';
import { getSeuilsAlertes } from '@/lib/settings';
import { computePaiementColis } from '@/modules/colis/colis.presenter';
import { getRentabiliteLot } from '@/modules/lots/rentabilite/rentabilite.service';

export type NiveauAlerte = 'CRITIQUE' | 'ATTENTION' | 'INFO';

export interface Alerte {
  code: string;
  niveau: NiveauAlerte;
  message: string;
  lotId?: string;
  lotNumber?: string;
  colisId?: string;
  clientId?: string;
  clientNom?: string;
  clientTelephone?: string;
  createdAt: Date;
}

const STATUTS_LOT_FACTURABLES = ['ARRIVE', 'EN_DEDOUANEMENT', 'EN_ENTREPOT'] as const;

// Calcul à la volée (pas de table persistée) — même principe que le module créances existant.
// Réutilise computePaiementColis (source de vérité du solde par colis) et getRentabiliteLot
// (marge par lot) pour ne dupliquer aucune logique de calcul financier.
export async function listAlertes(filters?: { niveau?: NiveauAlerte; lotId?: string; clientId?: string }) {
  const seuils = await getSeuilsAlertes();
  const alertes: Alerte[] = [];

  const colis = await prisma.colis.findMany({
    where: {
      deletedAt: null,
      factureId: { not: null },
      ...(filters?.lotId ? { lotId: filters.lotId } : {}),
      ...(filters?.clientId ? { clientId: filters.clientId } : {}),
    },
    include: {
      client: true,
      lot: true,
      facture: { include: { paiements: { where: { deletedAt: null } } } },
    },
  });

  const maintenant = Date.now();

  for (const c of colis) {
    const { montantPayeGnf, resteAPayerGnf, tropPercuGnf, statutPaiement } = computePaiementColis(c.facture);
    const ageJours = Math.floor((maintenant - c.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    const telephone = c.client.phoneWhatsapp ?? c.client.phoneGn ?? undefined;

    if (statutPaiement === 'IMPAYE') {
      alertes.push({
        code: 'IMPAYE_TOTAL',
        niveau: 'CRITIQUE',
        message: `Colis ${c.trackingId} — aucun paiement reçu`,
        lotId: c.lotId ?? undefined,
        lotNumber: c.lot?.lotNumber,
        colisId: c.id,
        clientId: c.clientId,
        clientNom: c.client.fullName,
        clientTelephone: telephone,
        createdAt: c.createdAt,
      });
    }

    if (resteAPayerGnf > 0 && ageJours > seuils.joursAvantAlerteCreance) {
      alertes.push({
        code: 'RESTE_ANCIEN',
        niveau: 'CRITIQUE',
        message: `${c.client.fullName} — ${Math.round(resteAPayerGnf).toLocaleString('fr-FR')} GNF impayés depuis ${ageJours} jours`,
        lotId: c.lotId ?? undefined,
        lotNumber: c.lot?.lotNumber,
        colisId: c.id,
        clientId: c.clientId,
        clientNom: c.client.fullName,
        clientTelephone: telephone,
        createdAt: c.createdAt,
      });
    }

    if (statutPaiement === 'PARTIEL') {
      alertes.push({
        code: 'PAIEMENT_PARTIEL',
        niveau: 'ATTENTION',
        message: `${c.client.fullName} — reste ${Math.round(resteAPayerGnf).toLocaleString('fr-FR')} GNF sur colis ${c.trackingId}`,
        lotId: c.lotId ?? undefined,
        lotNumber: c.lot?.lotNumber,
        colisId: c.id,
        clientId: c.clientId,
        clientNom: c.client.fullName,
        clientTelephone: telephone,
        createdAt: c.createdAt,
      });
    }

    if (statutPaiement === 'TROP_PERCU') {
      alertes.push({
        code: 'TROP_PERCU',
        niveau: 'INFO',
        message: `Avoir de ${Math.round(tropPercuGnf).toLocaleString('fr-FR')} GNF à restituer à ${c.client.fullName}`,
        lotId: c.lotId ?? undefined,
        lotNumber: c.lot?.lotNumber,
        colisId: c.id,
        clientId: c.clientId,
        clientNom: c.client.fullName,
        clientTelephone: telephone,
        createdAt: c.createdAt,
      });
    }

    void montantPayeGnf;
  }

  // SEUIL_CREANCE : total dû par client (tous colis confondus, indépendamment du filtre lot).
  const parClient = new Map<
    string,
    { client: { id: string; fullName: string; telephone?: string }; totalDuGnf: number }
  >();
  for (const c of colis) {
    const { resteAPayerGnf } = computePaiementColis(c.facture);
    if (resteAPayerGnf <= 0) continue;
    const entry = parClient.get(c.clientId) ?? {
      client: { id: c.clientId, fullName: c.client.fullName, telephone: c.client.phoneWhatsapp ?? c.client.phoneGn ?? undefined },
      totalDuGnf: 0,
    };
    entry.totalDuGnf += resteAPayerGnf;
    parClient.set(c.clientId, entry);
  }
  for (const { client, totalDuGnf } of parClient.values()) {
    if (totalDuGnf > seuils.seuilCreanceGnf) {
      alertes.push({
        code: 'SEUIL_CREANCE',
        niveau: 'CRITIQUE',
        message: `${client.fullName} dépasse le seuil de créance (${Math.round(totalDuGnf).toLocaleString('fr-FR')} GNF)`,
        clientId: client.id,
        clientNom: client.fullName,
        clientTelephone: client.telephone,
        createdAt: new Date(),
      });
    }
  }

  // Alertes par lot : LOT_DEFICITAIRE, MARGE_FAIBLE, DEPENSE_MANQUANTE.
  const lots = await prisma.lot.findMany({
    where: {
      deletedAt: null,
      status: { in: [...STATUTS_LOT_FACTURABLES] },
      ...(filters?.lotId ? { id: filters.lotId } : {}),
    },
    include: { depenses: { where: { deletedAt: null } } },
  });

  for (const lot of lots) {
    const rentabilite = await getRentabiliteLot(lot.id);

    if (rentabilite.resultats.margeBruteGnf < 0) {
      alertes.push({
        code: 'LOT_DEFICITAIRE',
        niveau: 'CRITIQUE',
        message: `Lot ${lot.lotNumber} déficitaire de ${Math.round(Math.abs(rentabilite.resultats.margeBruteGnf)).toLocaleString('fr-FR')} GNF`,
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        createdAt: lot.updatedAt,
      });
    } else if (
      rentabilite.resultats.margeBruteGnf > 0 &&
      rentabilite.resultats.tauxMargePourcent < seuils.seuilMargeFaiblePourcent
    ) {
      alertes.push({
        code: 'MARGE_FAIBLE',
        niveau: 'ATTENTION',
        message: `Lot ${lot.lotNumber} — marge faible (${rentabilite.resultats.tauxMargePourcent.toFixed(1)} %)`,
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        createdAt: lot.updatedAt,
      });
    }

    const categoriesPresentes = new Set(lot.depenses.map((d) => d.categorie));
    for (const categorieRequise of ['DEDOUANEMENT', 'TRANSPORT_AEROPORT_MADINA'] as const) {
      if (!categoriesPresentes.has(categorieRequise)) {
        const libelle = categorieRequise === 'DEDOUANEMENT' ? 'dédouanement' : 'transport aéroport → Madina';
        alertes.push({
          code: 'DEPENSE_MANQUANTE',
          niveau: 'ATTENTION',
          message: `Frais de ${libelle} non saisis sur lot ${lot.lotNumber}`,
          lotId: lot.id,
          lotNumber: lot.lotNumber,
          createdAt: lot.updatedAt,
        });
      }
    }
  }

  const filtrees = filters?.niveau ? alertes.filter((a) => a.niveau === filters.niveau) : alertes;
  return filtrees.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
