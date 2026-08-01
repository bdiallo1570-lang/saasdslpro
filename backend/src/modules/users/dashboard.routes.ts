import { Router } from 'express';
import { requireAuth, requirePermission } from '@/middleware/auth';

// Démonstration Phase 1 : point d'entrée des dashboards par rôle.
// Les données financières réelles (CA, marges) arriveront en Phase 4 ;
// ici on ne fait que garantir le contrôle d'accès Admin-only.
export const dashboardRouter = Router();

dashboardRouter.get(
  '/financier',
  requireAuth,
  requirePermission('finance:read_margins'),
  (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        message: 'Dashboard financier — réservé au rôle Admin.',
        // Placeholder : chiffres réels branchés en Phase 4 (module Dashboard).
      },
      error: null,
    });
  },
);
