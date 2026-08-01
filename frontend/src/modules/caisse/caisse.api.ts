import { apiClient, ApiResponse } from '@/lib/apiClient';

export type CashTransactionType = 'ENTREE' | 'DEPENSE';
export type CashClosureStatus = 'OUVERTE' | 'CLOTUREE';

export interface CashTransaction {
  id: string;
  closureId: string;
  type: CashTransactionType;
  category: string | null;
  label: string;
  montant: string;
  currency: string;
  method: string | null;
  createdAt: string;
}

export interface CashRegisterClosure {
  id: string;
  date: string;
  currency: string;
  status: CashClosureStatus;
  fondOuverture: string;
  soldeTheorique: string | null;
  comptagePhysique: string | null;
  ecart: string | null;
  transactions: CashTransaction[];
}

export async function getOpenClosure(currency = 'GNF'): Promise<CashRegisterClosure | null> {
  const res = await apiClient.get<ApiResponse<CashRegisterClosure | null>>('/caisse/ouverte', {
    params: { currency },
  });
  return res.data.data;
}

export async function openClosure(
  currency: string,
  fondOuverture: number,
): Promise<CashRegisterClosure> {
  const res = await apiClient.post<ApiResponse<CashRegisterClosure>>('/caisse/ouvrir', {
    currency,
    fondOuverture,
  });
  return res.data.data!;
}

export async function createTransaction(input: {
  closureId: string;
  type: CashTransactionType;
  category?: string;
  label: string;
  montant: number;
  currency: string;
  method?: string;
}): Promise<CashTransaction> {
  const res = await apiClient.post<ApiResponse<CashTransaction>>('/caisse/transactions', input);
  return res.data.data!;
}

export async function closeClosure(
  closureId: string,
  comptagePhysique: number,
): Promise<CashRegisterClosure> {
  const res = await apiClient.post<ApiResponse<CashRegisterClosure>>(`/caisse/${closureId}/cloturer`, {
    comptagePhysique,
  });
  return res.data.data!;
}

export async function downloadClosureReportPdf(closureId: string, dateLabel: string): Promise<void> {
  const res = await apiClient.get(`/caisse/${closureId}/rapport-pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = `rapport-cloture-${dateLabel}.pdf`;
  link.click();
  window.URL.revokeObjectURL(url);
}
