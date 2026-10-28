import { apiClient, ApiResponse } from '@/lib/apiClient';
import { Colis } from '@/modules/colis/colis.api';
import { Client } from '@/modules/clients/clients.api';

export type FactureStatus = 'IMPAYE' | 'PARTIEL' | 'PAYE';

export interface Facture {
  id: string;
  factureNumber: string;
  clientId: string;
  client?: Client;
  montantTotal: string;
  currency: string;
  status: FactureStatus;
  livraisonDebloqueeManuel: boolean;
  colis?: Colis[];
}

export async function listUnbilledColis(clientId: string): Promise<Colis[]> {
  const res = await apiClient.get<ApiResponse<Colis[]>>(`/factures/client/${clientId}/colis-non-factures`);
  return res.data.data ?? [];
}

export async function createFacture(clientId: string, colisIds: string[]): Promise<Facture> {
  const res = await apiClient.post<ApiResponse<Facture>>('/factures', { clientId, colisIds });
  return res.data.data!;
}

export async function getFacture(id: string): Promise<Facture> {
  const res = await apiClient.get<ApiResponse<Facture>>(`/factures/${id}`);
  return res.data.data!;
}

export async function listFacturesByClient(clientId: string): Promise<Facture[]> {
  const res = await apiClient.get<ApiResponse<Facture[]>>(`/factures/client/${clientId}`);
  return res.data.data ?? [];
}

export async function debloquerLivraison(factureId: string, motif: string): Promise<Facture> {
  const res = await apiClient.post<ApiResponse<Facture>>(`/factures/${factureId}/debloquer-livraison`, {
    motif,
  });
  return res.data.data!;
}

export async function downloadFacturePdf(factureId: string, factureNumber: string): Promise<void> {
  const res = await apiClient.get(`/factures/${factureId}/pdf`, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `facture-${factureNumber}.pdf`;
  link.click();
  window.URL.revokeObjectURL(url);
}
