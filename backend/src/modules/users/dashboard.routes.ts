import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { asyncHandler } from '@/lib/asyncHandler';
import { getDashboardOverview } from './dashboard.service';

// Point d'entrée du Dashboard Financier Admin — vue d'ensemble transversale de l'activité
// (colis en transit, lots actifs, CA encaissé, impayés, caisse du jour). Réservé à l'Admin
// via la permission finance:read_margins (données financières sensibles).
export const dashboardRouter = Router();

dashboardRouter.get(
  '/financier',
  requireAuth,
  requirePermission('finance:read_margins'),
  asyncHandler(async (_req, res) => {
    const overview = await getDashboardOverview();
    res.status(200).json({ success: true, data: overview, error: null });
  }),
);
