import { apiClient, ApiResponse } from '@/lib/apiClient';

export type ForeignCurrency = 'USD' | 'EUR' | 'CNY';

export interface ExchangeRate {
  id: string;
  fromCurrency: ForeignCurrency;
  toCurrency: 'GNF';
  rate: string;
  effectiveFrom: string;
  createdByUserId: string | null;
  createdAt: string;
}

export interface CreateRateInput {
  fromCurrency: ForeignCurrency;
  rate: number;
  effectiveFrom: string;
}

export async function listExchangeRates(): Promise<ExchangeRate[]> {
  const res = await apiClient.get<ApiResponse<ExchangeRate[]>>('/exchange-rates');
  return res.data.data ?? [];
}

export async function createExchangeRate(input: CreateRateInput): Promise<ExchangeRate> {
  const res = await apiClient.post<ApiResponse<ExchangeRate>>('/exchange-rates', input);
  return res.data.data!;
}
