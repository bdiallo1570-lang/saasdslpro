import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';
import { DEFAULT_PERMISSIONS, ROLE_NAMES } from '../src/config/roles';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed : rôles...');
  const roles = await Promise.all(
    Object.values(ROLE_NAMES).map((roleName) =>
      prisma.role.upsert({
        where: { roleName },
        update: { permissionsJson: DEFAULT_PERMISSIONS[roleName] },
        create: { roleName, permissionsJson: DEFAULT_PERMISSIONS[roleName] },
      }),
    ),
  );
  const roleByName = Object.fromEntries(roles.map((r) => [r.roleName, r]));

  console.log('Seed : tarifs par défaut...');
  await prisma.pricingRule.upsert({
    where: { id: 'seed-standard' },
    update: {},
    create: {
      id: 'seed-standard',
      categoryName: 'STANDARD',
      label: 'Colis standard',
      pricePerKg: 160000,
      currency: 'GNF',
      effectiveFrom: new Date(),
      isActive: true,
    },
  });
  await prisma.pricingRule.upsert({
    where: { id: 'seed-risque' },
    update: {},
    create: {
      id: 'seed-risque',
      categoryName: 'RISQUE',
      label: 'Colis à risque',
      pricePerKg: 180000,
      currency: 'GNF',
      effectiveFrom: new Date(),
      isActive: true,
    },
  });

  console.log('Seed : types de produits à risque...');
  const riskTypes = [
    'Liquides',
    'Batteries au lithium',
    'Produits inflammables',
    'Aérosols',
    'Produits magnétiques',
    'Poudres',
    'Cosmétiques liquides',
  ];
  for (const name of riskTypes) {
    await prisma.riskProductType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Seed : entrepôts...');
  await prisma.warehouseLocation.upsert({
    where: { id: 'seed-guangzhou' },
    update: {
      addressZh: '广东省广州市越秀区环市中路207号恒生大厦C座705',
      addressFr:
        '705, Bloc C, Immeuble Hengsten, 207 Huanshi Middle Road, District de Yuexiu, Guangzhou, Province du Guangdong, Chine',
      contactNumbersJson: { Man: '+8613246463616', Amadou: '+8617620097697', Luna: '' },
    },
    create: {
      id: 'seed-guangzhou',
      name: 'Entrepôt Guangzhou',
      addressZh: '广东省广州市越秀区环市中路207号恒生大厦C座705',
      addressFr:
        '705, Bloc C, Immeuble Hengsten, 207 Huanshi Middle Road, District de Yuexiu, Guangzhou, Province du Guangdong, Chine',
      contactNumbersJson: { Man: '+8613246463616', Amadou: '+8617620097697', Luna: '' },
      location: 'CHINE',
    },
  });
  await prisma.warehouseLocation.upsert({
    where: { id: 'seed-conakry' },
    update: {
      addressFr:
        "Madina, Gare voitures Liberia, juste en face du Centre Ariboyah, Centre Sidy, 2ème étage, Boutique C6, Conakry, Guinée",
    },
    create: {
      id: 'seed-conakry',
      name: 'Entrepôt Conakry',
      addressZh: null,
      addressFr:
        "Madina, Gare voitures Liberia, juste en face du Centre Ariboyah, Centre Sidy, 2ème étage, Boutique C6, Conakry, Guinée",
      contactNumbersJson: { 'Boubacar Diallo': '' },
      location: 'GUINEE',
    },
  });

  console.log('Seed : paramètres globaux...');
  await prisma.setting.upsert({
    where: { key: 'diviseur_volumetrique' },
    update: {},
    create: { key: 'diviseur_volumetrique', value: 6000 },
  });
  await prisma.setting.upsert({
    where: { key: 'mode_facturation' },
    update: {},
    create: { key: 'mode_facturation', value: 'poids_reel' },
  });

  console.log('Seed : utilisateurs de démonstration...');
  const demoUsers = [
    {
      fullName: 'Boubacar Diallo (Admin)',
      phoneNumber: '+224600000001',
      email: 'admin@dslaircargo.com',
      password: 'ChangeMoi123!',
      roleName: ROLE_NAMES.ADMIN,
      location: null,
    },
    {
      fullName: 'Agent Chine Démo',
      phoneNumber: '+8613800000002',
      email: 'agent.chine@dslaircargo.com',
      password: 'ChangeMoi123!',
      roleName: ROLE_NAMES.AGENT_CHINE,
      location: 'CHINE' as const,
    },
    {
      fullName: 'Agent Guinée Démo',
      phoneNumber: '+224600000003',
      email: 'agent.guinee@dslaircargo.com',
      password: 'ChangeMoi123!',
      roleName: ROLE_NAMES.AGENT_GUINEE,
      location: 'GUINEE' as const,
    },
  ];

  for (const demo of demoUsers) {
    const passwordHash = await hashPassword(demo.password);
    await prisma.user.upsert({
      where: { phoneNumber: demo.phoneNumber },
      update: {},
      create: {
        fullName: demo.fullName,
        phoneNumber: demo.phoneNumber,
        email: demo.email,
        passwordHash,
        roleId: roleByName[demo.roleName].id,
        location: demo.location,
        isActive: true,
      },
    });
  }

  const agentChine = await prisma.user.findUnique({ where: { phoneNumber: '+8613800000002' } });
  const agentGuinee = await prisma.user.findUnique({ where: { phoneNumber: '+224600000003' } });

  console.log('Seed : clients de démonstration...');
  const demoClients = [
    { clientCode: 'DSL-201', fullName: 'Mamadou Diallo', phoneGn: '+224622111111', phoneWhatsapp: '+224622111111' },
    { clientCode: 'DSL-202', fullName: 'Fatoumata Camara', phoneGn: '+224622222222', phoneWhatsapp: '+224622222222' },
    { clientCode: 'DSL-203', fullName: 'Ibrahima Sow', phoneGn: '+224622333333', phoneWhatsapp: '+224622333333' },
  ];
  const clients = await Promise.all(
    demoClients.map((c) =>
      prisma.client.upsert({
        where: { clientCode: c.clientCode },
        update: {},
        create: c,
      }),
    ),
  );

  console.log('Seed : module Agent Guinée (lot, colis, dépenses, paiements)...');
  const standardRule = await prisma.pricingRule.findUniqueOrThrow({ where: { id: 'seed-standard' } });

  const lot = await prisma.lot.upsert({
    where: { lotNumber: 'DSL-2026-90001' },
    update: {},
    create: {
      lotNumber: 'DSL-2026-90001',
      flightNumber: 'CA987',
      status: 'EN_ENTREPOT',
    },
  });

  // 6 colis répartis sur 3 clients (2 chacun) — poids réel identique pour simplifier le seed.
  const colisSpecs = [
    { client: clients[0], desc: 'Vêtements et chaussures', poids: 20 },
    { client: clients[0], desc: 'Électroménager léger', poids: 15 },
    { client: clients[1], desc: 'Pièces détachées auto', poids: 30 },
    { client: clients[1], desc: 'Cosmétiques', poids: 10 },
    { client: clients[2], desc: 'Jouets et accessoires', poids: 12 },
    { client: clients[2], desc: 'Matériel informatique', poids: 8 },
  ];

  const colisCrees = [];
  for (let i = 0; i < colisSpecs.length; i++) {
    const spec = colisSpecs[i];
    const trackingId = `DSL-2026-9${String(i + 1).padStart(4, '0')}`;
    const montantEstime = spec.poids * Number(standardRule.pricePerKg);

    const colis = await prisma.colis.upsert({
      where: { trackingId },
      update: {},
      create: {
        trackingId,
        clientId: spec.client.id,
        lotId: lot.id,
        description: spec.desc,
        poidsReelKg: spec.poids,
        poidsVolumetriqueKg: 0,
        poidsTaxableKg: spec.poids,
        categorieTarif: 'STANDARD',
        pricingRuleId: standardRule.id,
        montantEstime,
        currency: 'GNF',
        status: 'DISPONIBLE_ENTREPOT',
        createdByUserId: agentChine?.id,
      },
    });
    colisCrees.push(colis);
  }

  // Facturation mono-colis (comme le ferait ensureFactureForColis en conditions réelles).
  const facturesCrees = [];
  for (const colis of colisCrees) {
    const existing = await prisma.colis.findUnique({ where: { id: colis.id } });
    if (existing?.factureId) {
      facturesCrees.push(await prisma.facture.findUniqueOrThrow({ where: { id: existing.factureId } }));
      continue;
    }
    const factureNumber = `FAC-2026-9${String(facturesCrees.length + 1).padStart(4, '0')}`;
    const facture = await prisma.facture.upsert({
      where: { factureNumber },
      update: {},
      create: {
        factureNumber,
        clientId: colis.clientId,
        montantTotal: colis.montantEstime,
        currency: colis.currency,
        status: 'IMPAYE',
      },
    });
    await prisma.colis.update({ where: { id: colis.id }, data: { factureId: facture.id } });
    facturesCrees.push(facture);
  }

  // 5 paiements dont 2 partiels — colis[0] soldé, colis[1] soldé, colis[2] partiel,
  // colis[3] partiel, colis[4] impayé (aucun paiement), colis[5] impayé.
  if (agentGuinee) {
    const paiementsSpecs = [
      { colisIndex: 0, montant: Number(facturesCrees[0].montantTotal) },
      { colisIndex: 1, montant: Number(facturesCrees[1].montantTotal) },
      { colisIndex: 2, montant: Number(facturesCrees[2].montantTotal) * 0.5 },
      { colisIndex: 3, montant: Number(facturesCrees[3].montantTotal) * 0.3 },
      { colisIndex: 3, montant: Number(facturesCrees[3].montantTotal) * 0.2 },
    ];

    for (const p of paiementsSpecs) {
      const facture = facturesCrees[p.colisIndex];
      const paiementsExistants = await prisma.paiement.findMany({ where: { factureId: facture.id } });
      const dejaPayeGnf = paiementsExistants.reduce((s, pay) => s + Number(pay.montant) * Number(pay.tauxVersGnf), 0);
      if (dejaPayeGnf >= Number(facture.montantTotal)) continue;

      await prisma.paiement.create({
        data: {
          factureId: facture.id,
          montant: p.montant,
          currency: 'GNF',
          tauxVersGnf: 1,
          method: 'ESPECES',
          receivedByUserId: agentGuinee.id,
        },
      });

      const totalPayeGnf = dejaPayeGnf + p.montant;
      const nouveauStatut =
        totalPayeGnf >= Number(facture.montantTotal) ? 'PAYE' : totalPayeGnf > 0 ? 'PARTIEL' : 'IMPAYE';
      await prisma.facture.update({ where: { id: facture.id }, data: { status: nouveauStatut } });
      await prisma.client.update({
        where: { id: facture.clientId },
        data: { totalSpent: { increment: p.montant }, outstandingBalance: { decrement: p.montant } },
      });
    }

    // 4 dépenses de lot : dédouanement, transport aéroport→Madina, manutention, stockage.
    const depensesSpecs = [
      { categorie: 'DEDOUANEMENT' as const, libelle: 'Frais de douane aéroport Conakry', montant: 800000 },
      { categorie: 'TRANSPORT_AEROPORT_MADINA' as const, libelle: 'Transport camion aéroport → Madina', montant: 350000 },
      { categorie: 'MANUTENTION' as const, libelle: "Déchargement et main d'œuvre", montant: 150000 },
      { categorie: 'STOCKAGE' as const, libelle: 'Magasinage aéroport (3 jours)', montant: 200000 },
    ];
    for (const d of depensesSpecs) {
      await prisma.depenseLot.upsert({
        where: { id: `seed-depense-${d.categorie.toLowerCase()}` },
        update: {},
        create: {
          id: `seed-depense-${d.categorie.toLowerCase()}`,
          lotId: lot.id,
          categorie: d.categorie,
          libelle: d.libelle,
          montant: d.montant,
          currency: 'GNF',
          tauxVersGnf: 1,
          montantGnf: d.montant,
          dateDepense: new Date(),
          saisiParUserId: agentGuinee.id,
        },
      });
    }
  }

  console.log('Seed terminé avec succès.');
  console.log('Comptes de démonstration (mot de passe : ChangeMoi123!) :');
  demoUsers.forEach((u) => console.log(`  - ${u.roleName}: ${u.phoneNumber} / ${u.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
