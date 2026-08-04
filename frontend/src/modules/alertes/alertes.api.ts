import { apiClient, ApiResponse } from '@/lib/apiClient';

export type NiveauAlerte = 'CRITIQUE' | 'ATTENTION' | 'INFO';

export interface Alerte {
  code: string;
  niveau: NiveauAlerte;
  message: string;
  lotId?: string;
  lotNumber?: string;
  colisId?: string;
  clientId?: string;
  clientNom?: string;
  clientTelephone?: string;
  createdAt: string;
}

export async function listAlertes(filters?: {
  niveau?: NiveauAlerte;
  lotId?: string;
  clientId?: string;
}): Promise<Alerte[]> {
  const res = await apiClient.get<ApiResponse<Alerte[]>>('/alertes', { params: filters });
  return res.data.data ?? [];
}

export interface SeuilsAlertes {
  seuilCreanceGnf: number;
  seuilMargeFaiblePourcent: number;
  joursAvantAlerteCreance: number;
}

export async function getSeuilsAlertes(): Promise<SeuilsAlertes> {
  const res = await apiClient.get<ApiResponse<SeuilsAlertes>>('/parametres/alertes');
  return res.data.data!;
}

export async function updateSeuilsAlertes(input: Partial<SeuilsAlertes>): Promise<SeuilsAlertes> {
  const res = await apiClient.patch<ApiResponse<SeuilsAlertes>>('/parametres/alertes', input);
  return res.data.data!;
}
