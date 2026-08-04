import { apiClient, ApiResponse } from '@/lib/apiClient';

export interface DashboardOverview {
  colisEnTransit: number;
  colisLivresAujourdhui: number;
  lotsActifs: number;
  caEncaisse: number;
  totalImpayes: number;
  nombreFacturesImpayees: number;
  caisseDuJourGnf: number;
  nombreCaissesOuvertes: number;
  colisParStatut: Partial<Record<string, number>>;
  derniereActivite: {
    dernierColis: {
      trackingId: string;
      clientNom: string;
      status: string;
      createdAt: string;
    } | null;
    dernierLot: {
      lotNumber: string;
      status: string;
      updatedAt: string;
    } | null;
  };
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const res = await apiClient.get<ApiResponse<DashboardOverview>>('/dashboard/financier');
  return res.data.data!;
}
