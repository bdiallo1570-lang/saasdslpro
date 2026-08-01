import { prisma } from '@/lib/prisma';

const DEFAULT_VOLUMETRIC_DIVISOR = 6000;

export async function getVolumetricDivisor(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: 'diviseur_volumetrique' } });
  const value = setting?.value;
  return typeof value === 'number' && value > 0 ? value : DEFAULT_VOLUMETRIC_DIVISOR;
}

export async function getBillingMode(): Promise<'poids_reel' | 'poids_taxable'> {
  const setting = await prisma.setting.findUnique({ where: { key: 'mode_facturation' } });
  return setting?.value === 'poids_taxable' ? 'poids_taxable' : 'poids_reel';
}
