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
