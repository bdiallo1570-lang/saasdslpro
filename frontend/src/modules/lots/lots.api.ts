import { apiClient, ApiResponse } from '@/lib/apiClient';
import { Colis } from '@/modules/colis/colis.api';

export type LotStatus =
  | 'EN_RECEPTION'
  | 'FERME'
  | 'ENVOLE'
  | 'ARRIVE'
  | 'EN_DEDOUANEMENT'
  | 'EN_ENTREPOT'
  | 'CLOTURE';

export interface Lot {
  id: string;
  lotNumber: string;
  flightNumber: string | null;
  departureDate: string | null;
  estimatedArrival: string | null;
  customsCost: string | null;
  freightCost: string | null;
  status: LotStatus;
  // Absents pour l'Agent Chine (donnée financière — voir backend lots.controller.ts presentLot).
  tauxVersGnfFige?: string | null;
  tauxDeviseOrigine?: string | null;
  _count?: { colis: number };
  colis?: Colis[];
}

export const LOT_STATUS_LABELS: Record<LotStatus, string> = {
  EN_RECEPTION: 'En réception',
  FERME: 'Fermé',
  ENVOLE: 'Envolé',
  ARRIVE: 'Arrivé',
  EN_DEDOUANEMENT: 'En dédouanement',
  EN_ENTREPOT: 'En entrepôt',
  CLOTURE: 'Clôturé',
};

export async function listLots(): Promise<Lot[]> {
  const res = await apiClient.get<ApiResponse<Lot[]>>('/lots');
  return res.data.data ?? [];
}

export async function getLot(id: string): Promise<Lot> {
  const res = await apiClient.get<ApiResponse<Lot>>(`/lots/${id}`);
  return res.data.data!;
}

export async function createLot(flightNumber?: string): Promise<Lot> {
  const res = await apiClient.post<ApiResponse<Lot>>('/lots', { flightNumber });
  return res.data.data!;
}

export async function assignColisToLot(lotId: string, colisIds: string[]): Promise<Lot> {
  const res = await apiClient.post<ApiResponse<Lot>>(`/lots/${lotId}/assign-colis`, { colisIds });
  return res.data.data!;
}

export async function setLotFlightInfo(
  lotId: string,
  flightNumber: string,
  departureDate: string,
  transitDurationHours = 30,
): Promise<Lot> {
  const res = await apiClient.patch<ApiResponse<Lot>>(`/lots/${lotId}/flight-info`, {
    flightNumber,
    departureDate,
    transitDurationHours,
  });
  return res.data.data!;
}

export async function updateLotStatus(lotId: string, status: LotStatus): Promise<Lot> {
  const res = await apiClient.patch<ApiResponse<Lot>>(`/lots/${lotId}/status`, { status });
  return res.data.data!;
}
