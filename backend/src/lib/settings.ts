import { prisma } from '@/lib/prisma';

const DEFAULT_VOLUMETRIC_DIVISOR = 6000;
const DEFAULT_WEIGHT_DISCREPANCY_THRESHOLD_PERCENT = 3;
const DEFAULT_SEUIL_CREANCE_GNF = 5_000_000;
const DEFAULT_SEUIL_MARGE_FAIBLE_POURCENT = 15;
const DEFAULT_JOURS_AVANT_ALERTE_CREANCE = 7;

export async function getVolumetricDivisor(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: 'diviseur_volumetrique' } });
  const value = setting?.value;
  return typeof value === 'number' && value > 0 ? value : DEFAULT_VOLUMETRIC_DIVISOR;
}

// Seuil (%) au-delà duquel un écart de poids Chine/Guinée déclenche une alerte Admin.
export async function getWeightDiscrepancyThreshold(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: 'seuil_ecart_poids_pourcent' } });
  const value = setting?.value;
  return typeof value === 'number' && value > 0 ? value : DEFAULT_WEIGHT_DISCREPANCY_THRESHOLD_PERCENT;
}

export async function getBillingMode(): Promise<'poids_reel' | 'poids_taxable'> {
  const setting = await prisma.setting.findUnique({ where: { key: 'mode_facturation' } });
  return setting?.value === 'poids_taxable' ? 'poids_taxable' : 'poids_reel';
}

// Seuils configurables du système d'alertes (module Agent Guinée) — Admin uniquement en écriture.
export interface SeuilsAlertes {
  seuilCreanceGnf: number;
  seuilMargeFaiblePourcent: number;
  joursAvantAlerteCreance: number;
}

export async function getSeuilsAlertes(): Promise<SeuilsAlertes> {
  const [creance, marge, jours] = await Promise.all([
    prisma.setting.findUnique({ where: { key: 'seuil_creance_gnf' } }),
    prisma.setting.findUnique({ where: { key: 'seuil_marge_faible_pourcent' } }),
    prisma.setting.findUnique({ where: { key: 'jours_avant_alerte_creance' } }),
  ]);

  return {
    seuilCreanceGnf:
      typeof creance?.value === 'number' && creance.value > 0 ? creance.value : DEFAULT_SEUIL_CREANCE_GNF,
    seuilMargeFaiblePourcent:
      typeof marge?.value === 'number' && marge.value > 0 ? marge.value : DEFAULT_SEUIL_MARGE_FAIBLE_POURCENT,
    joursAvantAlerteCreance:
      typeof jours?.value === 'number' && jours.value > 0 ? jours.value : DEFAULT_JOURS_AVANT_ALERTE_CREANCE,
  };
}

export async function setSeuilsAlertes(seuils: Partial<SeuilsAlertes>): Promise<SeuilsAlertes> {
  const updates: Promise<unknown>[] = [];
  if (seuils.seuilCreanceGnf !== undefined) {
    updates.push(
      prisma.setting.upsert({
        where: { key: 'seuil_creance_gnf' },
        update: { value: seuils.seuilCreanceGnf },
        create: { key: 'seuil_creance_gnf', value: seuils.seuilCreanceGnf },
      }),
    );
  }
  if (seuils.seuilMargeFaiblePourcent !== undefined) {
    updates.push(
      prisma.setting.upsert({
        where: { key: 'seuil_marge_faible_pourcent' },
        update: { value: seuils.seuilMargeFaiblePourcent },
        create: { key: 'seuil_marge_faible_pourcent', value: seuils.seuilMargeFaiblePourcent },
      }),
    );
  }
  if (seuils.joursAvantAlerteCreance !== undefined) {
    updates.push(
      prisma.setting.upsert({
        where: { key: 'jours_avant_alerte_creance' },
        update: { value: seuils.joursAvantAlerteCreance },
        create: { key: 'jours_avant_alerte_creance', value: seuils.joursAvantAlerteCreance },
      }),
    );
  }
  await Promise.all(updates);
  return getSeuilsAlertes();
}
