import { apiClient, ApiResponse } from '@/lib/apiClient';

export interface Client {
  id: string;
  clientCode: string;
  fullName: string;
  phoneGn: string | null;
  phoneCn: string | null;
  phoneWhatsapp: string | null;
  address: string | null;
  totalSpent: string;
  outstandingBalance: string;
}

export interface CreateClientInput {
  fullName: string;
  phoneGn?: string;
  phoneCn?: string;
  phoneWhatsapp?: string;
  address?: string;
}

export async function searchClients(query: string): Promise<Client[]> {
  const res = await apiClient.get<ApiResponse<Client[]>>('/clients', { params: { q: query || undefined } });
  return res.data.data ?? [];
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  const res = await apiClient.post<ApiResponse<Client>>('/clients', input);
  return res.data.data!;
}
