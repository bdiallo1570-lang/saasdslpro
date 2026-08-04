import { apiClient, ApiResponse } from '@/lib/apiClient';

export type StatutPaiementColis = 'IMPAYE' | 'PARTIEL' | 'SOLDE' | 'TROP_PERCU';
export type ModePaiement = 'ESPECES' | 'ORANGE_MONEY' | 'MTN_MOMO' | 'VIREMENT' | 'AUTRE';

export const MODE_PAIEMENT_LABELS: Record<ModePaiement, string> = {
  ESPECES: 'Espèces',
  ORANGE_MONEY: 'Orange Money',
  MTN_MOMO: 'MTN Mobile Money',
  VIREMENT: 'Virement bancaire',
  AUTRE: 'Autre',
};

export const STATUT_PAIEMENT_LABELS: Record<StatutPaiementColis, string> = {
  IMPAYE: 'Impayé',
  PARTIEL: 'Partiel',
  SOLDE: 'Soldé',
  TROP_PERCU: 'Trop-perçu',
};

export interface ClientColisPaiement {
  trackingId: string;
  colisId: string;
  dûGnf: number;
  payéGnf: number;
  resteGnf: number;
  statutPaiement: StatutPaiementColis;
}

export interface ClientPaiementsGroupe {
  client: { id: string; clientCode: string; fullName: string; phoneGn: string | null; phoneWhatsapp: string | null };
  dûGnf: number;
  payéGnf: number;
  resteGnf: number;
  colis: ClientColisPaiement[];
}

export interface Paiement {
  id: string;
  factureId: string;
  montant: string;
  currency: string;
  tauxVersGnf: string;
  method: ModePaiement;
  createdAt: string;
}

export interface CreatePaiementColisInput {
  colisId: string;
  montant: number;
  currency: string;
  tauxVersGnf?: number;
  method: ModePaiement;
  reference?: string;
  datePaiement?: string;
  commentaire?: string;
}

export async function getPaiementsParClient(lotId: string): Promise<ClientPaiementsGroupe[]> {
  const res = await apiClient.get<ApiResponse<ClientPaiementsGroupe[]>>(`/lots/${lotId}/paiements/par-client`);
  return res.data.data ?? [];
}

export async function listPaiementsByLot(lotId: string): Promise<Paiement[]> {
  const res = await apiClient.get<ApiResponse<Paiement[]>>(`/lots/${lotId}/paiements`);
  return res.data.data ?? [];
}

export async function createPaiementColis(
  lotId: string,
  input: CreatePaiementColisInput,
): Promise<{ paiement: Paiement; avertissement: string | null }> {
  const res = await apiClient.post<{ success: boolean; data: Paiement; avertissement: string | null }>(
    `/lots/${lotId}/paiements`,
    input,
  );
  return { paiement: res.data.data, avertissement: res.data.avertissement };
}

export async function listPaiementsForColis(colisId: string): Promise<Paiement[]> {
  const res = await apiClient.get<ApiResponse<Paiement[]>>(`/colis/${colisId}/paiements`);
  return res.data.data ?? [];
}

export async function downloadRecuPaiement(paiementId: string, factureNumber: string): Promise<void> {
  const res = await apiClient.get(`/paiements/${paiementId}/recu-pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = `recu-${factureNumber}.pdf`;
  link.click();
  window.URL.revokeObjectURL(url);
}
