import { apiClient, ApiResponse } from '@/lib/apiClient';
import { Client } from '@/modules/clients/clients.api';

export type PricingCategory = 'STANDARD' | 'RISQUE' | 'PERSONNALISE';
export type StatutPaiementColis = 'IMPAYE' | 'PARTIEL' | 'SOLDE' | 'TROP_PERCU';

// montantEstime/currency/pricingRuleId sont optionnels ici pour refléter fidèlement le typage
// backend (canReadPricing) — présents pour Admin/Caissier/Agent Guinée/Agent Chine (celui-ci
// fixe le prix à la réception et peut le modifier ensuite, voir updateColisPrice ci-dessous),
// absents uniquement pour les rôles sans accès aux prix (aucun rôle actuel n'est dans ce cas
// pour colis:read, ce typage optionnel reste défensif). Les champs
// montantDuGnf/montantPayeGnf/resteAPayerGnf/statutPaiement sont dérivés côté backend depuis
// la facture mono-colis (module Agent Guinée).
export interface Colis {
  id: string;
  trackingId: string;
  description: string;
  poidsReelKg: string;
  poidsVolumetriqueKg: string;
  poidsTaxableKg: string;
  categorieTarif: PricingCategory;
  montantEstime?: string;
  currency?: string;
  status: string;
  createdAt: string;
  dateReception: string | null;
  client: Partial<Client> & Pick<Client, 'id' | 'clientCode' | 'fullName'>;
  montantDuGnf?: number;
  montantPayeGnf?: number;
  resteAPayerGnf?: number;
  tropPercuGnf?: number;
  statutPaiement?: StatutPaiementColis;
}

// Date de réception effective à afficher/trier : la date saisie manuellement si renseignée,
// sinon l'horodatage système de création.
export function dateReceptionEffective(colis: Pick<Colis, 'dateReception' | 'createdAt'>): string {
  return colis.dateReception ?? colis.createdAt;
}

export interface CreateColisInput {
  clientId: string;
  description: string;
  poidsReelKg: number;
  longueurCm?: number;
  largeurCm?: number;
  hauteurCm?: number;
  categorieTarif: PricingCategory;
  tarifManuelParKg?: number;
  motifTarifManuel?: string;
  dateReception?: string;
}

export async function createColis(input: CreateColisInput): Promise<Colis> {
  const res = await apiClient.post<ApiResponse<Colis>>('/colis', input);
  return res.data.data!;
}

export async function getColisByTrackingId(trackingId: string): Promise<Colis> {
  const res = await apiClient.get<ApiResponse<Colis>>(`/colis/${trackingId}`);
  return res.data.data!;
}

export async function listColis(params?: {
  lotId?: string;
  status?: string | string[];
}): Promise<Colis[]> {
  const status = Array.isArray(params?.status) ? params.status.join(',') : params?.status;
  const res = await apiClient.get<ApiResponse<Colis[]>>('/colis', {
    params: { ...params, status },
  });
  return res.data.data ?? [];
}

// Statuts modifiables manuellement depuis les pills du Dashboard — LIVRE en est exclu
// délibérément côté backend (verrou entrepôt lié au paiement, règle 3.4 GEMINI.md).
export async function updateColisStatus(trackingId: string, status: string): Promise<Colis> {
  const res = await apiClient.patch<ApiResponse<Colis>>(`/colis/${trackingId}/statut`, { status });
  return res.data.data!;
}

// Modification du prix par l'Agent Chine/Admin — bloquée côté backend dès qu'un paiement a été
// enregistré sur le colis (409). Motif obligatoire, tracé dans le journal d'audit.
export async function updateColisPrice(
  trackingId: string,
  montantEstime: number,
  motif: string,
): Promise<Colis> {
  const res = await apiClient.patch<ApiResponse<Colis>>(`/colis/${trackingId}/prix`, {
    montantEstime,
    motif,
  });
  return res.data.data!;
}

export interface PriceSimulationResult {
  poidsKg: number;
  categorieTarif: 'STANDARD' | 'RISQUE';
  pricePerKg: string;
  currency: string;
  totalEstime: number;
}

export async function simulatePrice(
  categorieTarif: 'STANDARD' | 'RISQUE',
  poidsKg: number,
): Promise<PriceSimulationResult> {
  const res = await apiClient.post<ApiResponse<PriceSimulationResult>>('/colis/simulate-price', {
    categorieTarif,
    poidsKg,
  });
  return res.data.data!;
}

// montantEstime/currency/outstandingBalance/montantTotal absents pour l'Agent Guinée (voir
// backend scan.controller.ts) — optionnels pour refléter fidèlement la réponse selon le rôle.
export interface ScanResult {
  colis: {
    trackingId: string;
    description: string;
    poidsReelKg: string;
    status: string;
    montantEstime?: string;
    currency?: string;
  };
  client: {
    id: string;
    clientCode: string;
    fullName: string;
    outstandingBalance?: string;
  };
  lot: { lotNumber: string; status: string } | null;
  facture: {
    id: string;
    factureNumber: string;
    status: 'IMPAYE' | 'PARTIEL' | 'PAYE';
    montantTotal?: string;
    livraisonDebloqueeManuel: boolean;
  } | null;
  paymentStatus: 'PAYE' | 'IMPAYE_OU_PARTIEL' | 'NON_FACTURE';
  livraisonAutorisee: boolean;
}

export async function scanColis(trackingId: string): Promise<ScanResult> {
  const res = await apiClient.get<ApiResponse<ScanResult>>(`/colis/scan/${trackingId}`);
  return res.data.data!;
}

export async function marquerColisLivre(trackingId: string): Promise<Colis> {
  const res = await apiClient.post<ApiResponse<Colis>>(`/colis/${trackingId}/livrer`);
  return res.data.data!;
}

export interface WeightDiscrepancy {
  id: string;
  colisId: string;
  lotId: string | null;
  poidsChineKg: string;
  poidsGuineeKg: string;
  ecartPourcent: string;
  seuilAppliquePourcent: string;
  depasseSeuil: boolean;
  agentChineUserId: string | null;
  agentGuineeUserId: string;
  resolvedAt: string | null;
  resolvedByUserId: string | null;
  resolutionNote: string | null;
  createdAt: string;
  colis?: Colis;
}

export async function reportWeightDiscrepancy(
  trackingId: string,
  poidsGuineeKg: number,
): Promise<WeightDiscrepancy> {
  const res = await apiClient.post<ApiResponse<WeightDiscrepancy>>(
    `/colis/${trackingId}/signaler-ecart-poids`,
    { poidsGuineeKg },
  );
  return res.data.data!;
}

export async function listUnresolvedWeightDiscrepancies(): Promise<WeightDiscrepancy[]> {
  const res = await apiClient.get<ApiResponse<WeightDiscrepancy[]>>('/colis/ecarts-poids');
  return res.data.data ?? [];
}

export async function resolveWeightDiscrepancy(
  id: string,
  resolutionNote?: string,
): Promise<WeightDiscrepancy> {
  const res = await apiClient.patch<ApiResponse<WeightDiscrepancy>>(
    `/colis/ecarts-poids/${id}/resoudre`,
    { resolutionNote },
  );
  return res.data.data!;
}

export interface PublicTrackingResult {
  trackingId: string;
  description: string;
  poidsReelKg: string;
  status: string;
  createdAt: string;
  lot: {
    lotNumber: string;
    status: string;
    departureDate: string | null;
    estimatedArrival: string | null;
  } | null;
}

// Suivi public (landing page, sans authentification) — aucune donnée client exposée.
export async function trackColisPublic(trackingId: string): Promise<PublicTrackingResult> {
  const res = await apiClient.get<ApiResponse<PublicTrackingResult>>(
    `/colis/track/${encodeURIComponent(trackingId)}`,
  );
  return res.data.data!;
}
