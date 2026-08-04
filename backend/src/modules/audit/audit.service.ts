import { prisma } from '@/lib/prisma';

// Fil d'actualité transversal — les 5 dernières actions sensibles du système, visibles par les
// 3 rôles agent (Admin/Agent Chine/Agent Guinée) pour qu'ils se coordonnent sans se téléphoner.
export async function listRecentAuditLogs(limit = 5) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { fullName: true, role: { select: { roleName: true } } } } },
  });
}
