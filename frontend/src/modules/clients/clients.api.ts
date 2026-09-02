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

export async function getClientById(id: string): Promise<Client> {
  const res = await apiClient.get<ApiResponse<Client>>(`/clients/${id}`);
  return res.data.data!;
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  const res = await apiClient.post<ApiResponse<Client>>('/clients', input);
  return res.data.data!;
}

export async function updateClient(id: string, input: CreateClientInput): Promise<Client> {
  const res = await apiClient.put<ApiResponse<Client>>(`/clients/${id}`, input);
  return res.data.data!;
}

export async function deleteClient(id: string): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(`/clients/${id}`);
}

export interface ClientListItem {
  id: string;
  clientCode: string;
  fullName: string;
  phoneGn: string | null;
  phoneCn: string | null;
  phoneWhatsapp: string | null;
  corridor: string;
  nombreColis: number;
}

// Liste complète des clients avec nombre de colis — page Clients (Admin/Agent Chine/Agent
// Guinée). Distinct de searchClients (bornée à 20, sans compteur, utilisée par ClientPicker).
export async function listAllClients(): Promise<ClientListItem[]> {
  const res = await apiClient.get<ApiResponse<ClientListItem[]>>('/clients/liste-complete');
  return res.data.data ?? [];
}
