import { apiClient, ApiResponse } from '@/lib/apiClient';

export type CategorieDepenseLot =
  | 'DEDOUANEMENT'
  | 'TRANSPORT_AEROPORT_MADINA'
  | 'MANUTENTION'
  | 'STOCKAGE'
  | 'DOCUMENTATION'
  | 'DIVERS';

export const CATEGORIE_DEPENSE_LABELS: Record<CategorieDepenseLot, string> = {
  DEDOUANEMENT: 'Dédouanement',
  TRANSPORT_AEROPORT_MADINA: 'Transport aéroport → Madina',
  MANUTENTION: 'Manutention',
  STOCKAGE: 'Stockage',
  DOCUMENTATION: 'Documentation',
  DIVERS: 'Divers',
};

export interface DepenseLot {
  id: string;
  lotId: string;
  categorie: CategorieDepenseLot;
  libelle: string;
  montant: string;
  currency: string;
  tauxVersGnf: string;
  montantGnf: string;
  dateDepense: string;
  beneficiaire: string | null;
  referenceRecu: string | null;
  justificatifUrl: string | null;
  saisiParUserId: string;
  createdAt: string;
}

export interface SousTotalCategorie {
  categorie: CategorieDepenseLot;
  totalGnf: number;
}

export interface CreateDepenseInput {
  categorie: CategorieDepenseLot;
  libelle: string;
  montant: number;
  currency: string;
  tauxVersGnf?: number;
  dateDepense: string;
  beneficiaire?: string;
  referenceRecu?: string;
  justificatifUrl?: string;
}

export async function listDepensesByLot(
  lotId: string,
  filters?: { categorie?: CategorieDepenseLot; dateDebut?: string; dateFin?: string },
): Promise<{ depenses: DepenseLot[]; sousTotaux: SousTotalCategorie[] }> {
  const res = await apiClient.get<ApiResponse<{ depenses: DepenseLot[]; sousTotaux: SousTotalCategorie[] }>>(
    `/lots/${lotId}/depenses`,
    { params: filters },
  );
  return res.data.data ?? { depenses: [], sousTotaux: [] };
}

export async function createDepense(lotId: string, input: CreateDepenseInput): Promise<DepenseLot> {
  const res = await apiClient.post<ApiResponse<DepenseLot>>(`/lots/${lotId}/depenses`, input);
  return res.data.data!;
}

export async function updateDepense(id: string, input: CreateDepenseInput): Promise<DepenseLot> {
  const res = await apiClient.patch<ApiResponse<DepenseLot>>(`/depenses/${id}`, input);
  return res.data.data!;
}

export async function deleteDepense(id: string, motif: string): Promise<void> {
  await apiClient.delete(`/depenses/${id}`, { data: { motif } });
}
