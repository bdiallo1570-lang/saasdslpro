import { apiClient, ApiResponse } from '@/lib/apiClient';

export type PaymentMethod = 'ESPECES' | 'ORANGE_MONEY' | 'VIREMENT';

export interface Paiement {
  id: string;
  factureId: string;
  montant: string;
  currency: string;
  tauxVersGnf: string;
  method: PaymentMethod;
  createdAt: string;
}

export interface CreatePaiementInput {
  factureId: string;
  montant: number;
  currency: 'GNF' | 'USD' | 'EUR' | 'CNY';
  method: PaymentMethod;
  closureId?: string;
}

export async function createPaiement(input: CreatePaiementInput): Promise<Paiement> {
  const res = await apiClient.post<ApiResponse<Paiement>>('/paiements', input);
  return res.data.data!;
}

export async function listPaiementsByFacture(factureId: string): Promise<Paiement[]> {
  const res = await apiClient.get<ApiResponse<Paiement[]>>(`/paiements/facture/${factureId}`);
  return res.data.data ?? [];
}

// Le téléchargement nécessite le header Authorization -> on récupère le blob via axios
// puis on déclenche le téléchargement, plutôt qu'un lien <a href> direct.
export async function downloadReceiptPdf(paiementId: string, factureNumber: string): Promise<void> {
  const res = await apiClient.get(`/paiements/${paiementId}/recu-pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = `recu-${factureNumber}.pdf`;
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function relancerClient(clientId: string): Promise<{ success: boolean }> {
  const res = await apiClient.post<ApiResponse<{ success: boolean }>>(`/paiements/relancer/${clientId}`);
  return res.data.data!;
}
