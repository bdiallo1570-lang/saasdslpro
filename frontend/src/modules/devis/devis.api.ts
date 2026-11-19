import { apiClient, ApiResponse } from '@/lib/apiClient';

// Devis et factures proforma : propositions de prix, sans effet comptable (voir backend
// modules/devis). Les montants affichés pendant la saisie sont un aperçu : le serveur recalcule
// tout à l'enregistrement à partir des tarifs en base.

export type DevisStatus = 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE';
export type DevisLigneType = 'AERIEN_STANDARD' | 'AERIEN_SENSIBLE' | 'AERIEN_GROS_VOLUME' | 'MARITIME' | 'LIBRE';
export type DevisVariante = 'devis' | 'proforma';

export interface DevisLigne {
  type: DevisLigneType;
  libelle: string;
  quantite: number;
  unite: string;
  prixUnitaireUsd: number | null;
  prixUnitaire: number;
  montant: number;
}

export interface Devis {
  id: string;
  numero: string;
  numeroProforma: string;
  status: DevisStatus;
  expire: boolean;
  validUntil: string;
  tauxUsdGnf: number | null;
  sousTotal: number;
  remise: number;
  total: number;
  note: string | null;
  createdAt: string;
  client: { id: string; nom: string; code: string; telephone: string | null };
  lignes: DevisLigne[];
}

export interface Tarifs {
  standardGnfKg: number | null;
  sensibleGnfKg: number | null;
  maritimeUsdM3: number | null;
  tauxUsdGnf: number | null;
}

export interface LigneSaisie {
  type: DevisLigneType;
  quantite: number;
  libelle?: string;
  unite?: string;
  prixUnitaire?: number;
}

export interface DevisInput {
  clientId: string;
  validUntil?: string;
  remise: number;
  note?: string;
  lignes: LigneSaisie[];
}

export const STATUS_LABELS: Record<DevisStatus, string> = {
  BROUILLON: 'Brouillon',
  ENVOYE: 'Envoyé',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
};

export const LIGNE_LABELS: Record<DevisLigneType, string> = {
  AERIEN_STANDARD: 'Avion, Cargo Standard',
  AERIEN_SENSIBLE: 'Avion, Cargo Sensible',
  AERIEN_GROS_VOLUME: 'Avion, Gros volume (prix négocié)',
  MARITIME: 'Bateau',
  LIBRE: 'Ligne libre',
};

export async function listDevis(params: { q?: string; statut?: string }): Promise<Devis[]> {
  const res = await apiClient.get<ApiResponse<Devis[]>>('/devis', { params });
  return res.data.data ?? [];
}

export async function getTarifs(): Promise<Tarifs> {
  const res = await apiClient.get<ApiResponse<Tarifs>>('/devis/tarifs');
  return res.data.data!;
}

export async function saveDevis(input: DevisInput, id?: string): Promise<Devis> {
  const res = id
    ? await apiClient.put<ApiResponse<Devis>>(`/devis/${id}`, input)
    : await apiClient.post<ApiResponse<Devis>>('/devis', input);
  return res.data.data!;
}

export async function setDevisStatus(id: string, status: DevisStatus): Promise<Devis> {
  const res = await apiClient.patch<ApiResponse<Devis>>(`/devis/${id}/statut`, { status });
  return res.data.data!;
}

export async function deleteDevis(id: string): Promise<void> {
  await apiClient.delete(`/devis/${id}`);
}

export async function downloadDevisPdf(devis: Devis, variante: DevisVariante): Promise<void> {
  const res = await apiClient.get(`/devis/${devis.id}/pdf`, { params: { variante }, responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = variante === 'proforma' ? `proforma-${devis.numeroProforma}.pdf` : `devis-${devis.numero}.pdf`;
  link.click();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

// Lignes dont le prix unitaire est saisi par l'agent (et non lu dans les tarifs en base)
export function prixSaisi(type: DevisLigneType): boolean {
  return type === 'LIBRE' || type === 'AERIEN_GROS_VOLUME';
}

// Aperçu du prix unitaire d'une ligne (mêmes règles que le serveur, voir devis.calcul.ts)
export function prixApercu(ligne: LigneSaisie, tarifs: Tarifs | null): number | null {
  if (prixSaisi(ligne.type)) return ligne.prixUnitaire ?? null;
  if (!tarifs) return null;
  if (ligne.type === 'AERIEN_STANDARD') return tarifs.standardGnfKg;
  if (ligne.type === 'AERIEN_SENSIBLE') return tarifs.sensibleGnfKg;
  return tarifs.maritimeUsdM3 && tarifs.tauxUsdGnf ? Math.round(tarifs.maritimeUsdM3 * tarifs.tauxUsdGnf) : null;
}
