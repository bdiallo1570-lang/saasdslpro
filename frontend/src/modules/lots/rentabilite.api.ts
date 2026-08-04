import { apiClient, ApiResponse } from '@/lib/apiClient';
import { SousTotalCategorie } from './depenses.api';

export interface RentabiliteLot {
  lotNumber: string;
  revenus: { caFactureGnf: number; encaissementsGnf: number; creancesEnCoursGnf: number };
  depenses: { parCategorie: SousTotalCategorie[]; totalGnf: number };
  resultats: {
    margeBruteGnf: number;
    margeEncaisseeGnf: number;
    tauxMargePourcent: number;
    coutRevientParKgGnf: number;
    margeParKgGnf: number;
    poidsTaxableTotalKg: number;
  };
}

export async function getRentabiliteLot(lotId: string): Promise<RentabiliteLot> {
  const res = await apiClient.get<ApiResponse<RentabiliteLot>>(`/lots/${lotId}/rentabilite`);
  return res.data.data!;
}

export async function downloadBilanPdf(lotId: string, lotNumber: string): Promise<void> {
  const res = await apiClient.get(`/lots/${lotId}/bilan.pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = `bilan-${lotNumber}.pdf`;
  link.click();
  window.URL.revokeObjectURL(url);
}
