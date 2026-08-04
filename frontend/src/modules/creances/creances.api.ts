import { apiClient, ApiResponse } from '@/lib/apiClient';

export interface CreancesKpis {
  totalCreances: number;
  clientsARisque: number;
  paiementsPartiels: number;
  nombreFacturesImpayees: number;
}

export type RiskTier = 'FAIBLE' | 'MOYEN' | 'ELEVE';

export interface ClientDebiteur {
  client: {
    id: string;
    clientCode: string;
    fullName: string;
    phoneGn: string | null;
    phoneWhatsapp: string | null;
    telephone: string | null;
  };
  soldeDu: number;
  montantPayeTotal: number;
  ancienneteJours: number;
  nombreColisEnAttente: number;
  aPaiementPartiel: boolean;
  niveauRisque: RiskTier;
}

export async function getCreancesKpis(): Promise<CreancesKpis> {
  const res = await apiClient.get<ApiResponse<CreancesKpis>>('/creances/kpis');
  return res.data.data!;
}

export async function listClientsDebiteurs(): Promise<ClientDebiteur[]> {
  const res = await apiClient.get<ApiResponse<ClientDebiteur[]>>('/creances/debiteurs');
  return res.data.data ?? [];
}
