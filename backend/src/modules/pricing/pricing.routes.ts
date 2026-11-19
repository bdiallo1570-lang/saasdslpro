import { Router } from 'express';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/asyncHandler';
import { getPrixMaritimeUsdM3 } from '@/lib/settings';

import { consultationPubliqueLimiter } from '@/middleware/antiSpam';

export const pricingRouter = Router();

// Catégories publiées sur la landing (le tarif PERSONNALISE, négocié au cas par cas, ne l'est pas)
const PUBLIC_CATEGORIES = ['STANDARD', 'RISQUE'] as const;

// Public : la landing affiche le tarif au kilo avant toute connexion. On renvoie, pour chaque
// catégorie publique, le tarif actif le plus récent — le même que celui appliqué aux colis
// (voir getActivePricingRule dans colis/pricing.ts), pour que le site ne soit jamais en retard
// sur un changement de prix.
pricingRouter.get(
  '/',
  consultationPubliqueLimiter,
  asyncHandler(async (_req, res) => {
    const rules = await Promise.all(
      PUBLIC_CATEGORIES.map((categoryName) =>
        prisma.pricingRule.findFirst({
          where: { categoryName, isActive: true },
          orderBy: { effectiveFrom: 'desc' },
          select: { categoryName: true, label: true, pricePerKg: true, currency: true, effectiveFrom: true },
        }),
      ),
    );
    const data = rules
      .filter((rule): rule is NonNullable<typeof rule> => rule !== null)
      .map((rule) => ({ ...rule, pricePerKg: Number(rule.pricePerKg) }));
    // Prix maritime au m³ (USD) à côté de la liste, pour ne pas changer la forme de `data`
    // (tarifs au kilo) déjà lue par le site.
    const maritime = await getPrixMaritimeUsdM3();
    return res.status(200).json({ success: true, data, error: null, maritimeUsdM3: maritime });
  }),
);
