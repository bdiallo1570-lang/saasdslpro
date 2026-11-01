import { Router } from 'express';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/asyncHandler';

export const pricingRouter = Router();

// Catégories publiées sur la landing (le tarif PERSONNALISE, négocié au cas par cas, ne l'est pas)
const PUBLIC_CATEGORIES = ['STANDARD', 'RISQUE'] as const;

// Public : la landing affiche le tarif au kilo avant toute connexion. On renvoie, pour chaque
// catégorie publique, le tarif actif le plus récent — le même que celui appliqué aux colis
// (voir getActivePricingRule dans colis/pricing.ts), pour que le site ne soit jamais en retard
// sur un changement de prix.
pricingRouter.get(
  '/',
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
    return res.status(200).json({ success: true, data, error: null });
  }),
);
