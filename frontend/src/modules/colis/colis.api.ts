import { apiClient, ApiResponse } from '@/lib/apiClient';
import { Client } from '@/modules/clients/clients.api';

export type PricingCategory = 'STANDARD' | 'RISQUE' | 'PERSONNALISE';

export interface Colis {
  id: string;
  trackingId: string;
  description: string;
  poidsReelKg: string;
  poidsVolumetriqueKg: string;
  poidsTaxableKg: string;
  categorieTarif: PricingCategory;
  montantEstime: string;
  currency: string;
  status: string;
  client: Client;
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
}

export async function createColis(input: CreateColisInput): Promise<Colis> {
  const res = await apiClient.post<ApiResponse<Colis>>('/colis', input);
  return res.data.data!;
}

export async function getColisByTrackingId(trackingId: string): Promise<Colis> {
  const res = await apiClient.get<ApiResponse<Colis>>(`/colis/${trackingId}`);
  return res.data.data!;
}

export async function listColis(params?: { lotId?: string; status?: string }): Promise<Colis[]> {
  const res = await apiClient.get<ApiResponse<Colis[]>>('/colis', { params });
  return res.data.data ?? [];
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

export interface ScanResult {
  colis: {
    trackingId: string;
    description: string;
    poidsReelKg: string;
    status: string;
    montantEstime: string;
    currency: string;
  };
  client: {
    id: string;
    clientCode: string;
    fullName: string;
    outstandingBalance: string;
  };
  lot: { lotNumber: string; status: string } | null;
  facture: {
    id: string;
    factureNumber: string;
    status: 'IMPAYE' | 'PARTIEL' | 'PAYE';
    montantTotal: string;
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
