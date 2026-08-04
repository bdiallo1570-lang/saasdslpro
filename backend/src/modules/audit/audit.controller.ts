import { Request, Response } from 'express';
import * as auditService from './audit.service';

// Whitelist explicite de metadata sûre à exposer par action — jamais de select Prisma ouvert
// sur `metadata`, pour ne pas fuiter accidentellement une donnée sensible (prix, motif interne)
// vers l'Agent Chine/Guinée qui ont accès à ce fil (règle Phase 1 : ni prix ni marges).
const SAFE_METADATA_KEYS: Record<string, string[]> = {
  'colis:cree': ['trackingId'],
  'colis:statut_modifie': ['trackingId', 'nouveauStatut'],
  'colis:ecart_poids_signale': ['lotId', 'ecartPourcent', 'depasseSeuil'],
  'colis:ecart_poids_resolu': [],
  'facture:deblocage_livraison': [],
};

export async function listRecentAuditLogsHandler(_req: Request, res: Response) {
  const logs = await auditService.listRecentAuditLogs(5);

  const safeLogs = logs.map((log) => {
    const allowedKeys = SAFE_METADATA_KEYS[log.action] ?? [];
    const rawMetadata = (log.metadata ?? {}) as Record<string, unknown>;
    const metadata = Object.fromEntries(
      allowedKeys.filter((key) => key in rawMetadata).map((key) => [key, rawMetadata[key]]),
    );

    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      createdAt: log.createdAt,
      userFullName: log.user?.fullName ?? null,
      userRole: log.user?.role.roleName ?? null,
      metadata,
    };
  });

  return res.status(200).json({ success: true, data: safeLogs, error: null });
}
