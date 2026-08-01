import { apiClient, ApiResponse } from '@/lib/apiClient';

export interface WarehouseLocation {
  id: string;
  name: string;
  addressZh: string | null;
  addressFr: string | null;
  contactNumbersJson: Record<string, string>;
  location: 'CHINE' | 'GUINEE';
}

export async function listWarehouses(): Promise<WarehouseLocation[]> {
  const res = await apiClient.get<ApiResponse<WarehouseLocation[]>>('/warehouses');
  return res.data.data ?? [];
}
