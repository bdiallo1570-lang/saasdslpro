import { apiClient, ApiResponse } from '@/lib/apiClient';

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  userFullName: string | null;
  userRole: string | null;
  metadata: Record<string, unknown>;
}

export async function listRecentAuditLogs(): Promise<AuditLogEntry[]> {
  const res = await apiClient.get<ApiResponse<AuditLogEntry[]>>('/audit/recent');
  return res.data.data ?? [];
}
