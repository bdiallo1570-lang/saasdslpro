import { apiClient, ApiResponse } from '@/lib/apiClient';
import { formatNumber } from '@/lib/format';

// Factures et reçus partagés avec le client par un lien signé (voir backend lib/documentLinks.ts)

export type DocumentType = 'facture' | 'recu';

export interface DocumentSummary {
  type: DocumentType;
  numero: string;
  clientNom: string;
  clientTelephone: string | null;
  date: string;
  montant: number;
  devise: string;
  reste: number;
  factureNumero: string;
}

interface ClientLink {
  token: string;
  url: string;
  summary: DocumentSummary;
}

// Espace agent : obtenir le lien à envoyer au client
export async function getClientLink(type: DocumentType, id: string): Promise<ClientLink> {
  const path = type === 'facture' ? `/factures/${id}/lien-client` : `/paiements/${id}/lien-client`;
  const res = await apiClient.get<ApiResponse<ClientLink>>(path);
  return res.data.data!;
}

// Page publique : résumé du document désigné par le lien
export async function getPublicDocument(token: string): Promise<DocumentSummary> {
  const res = await apiClient.get<ApiResponse<DocumentSummary>>(`/documents/${encodeURIComponent(token)}`);
  return res.data.data!;
}

export function publicPdfUrl(token: string, download: boolean): string {
  return `${apiClient.defaults.baseURL}/documents/${encodeURIComponent(token)}/pdf${download ? '?download=1' : ''}`;
}

// Lien de la page publique sur le site où l'agent travaille (le domaine que le client verra)
export function publicPageUrl(token: string): string {
  return `${window.location.origin}/document/${token}`;
}

// Message WhatsApp pré-rempli, au prénom du client
export function whatsappMessage(summary: DocumentSummary, url: string): string {
  const prenom = summary.clientNom.split(' ')[0];
  const reste =
    summary.reste > 0 ? `Reste à payer : ${formatNumber(summary.reste)} GNF.` : 'Votre facture est entièrement réglée.';
  const corps =
    summary.type === 'facture'
      ? `voici votre facture ${summary.numero} de DSL Air Cargo, d'un montant de ${formatNumber(summary.montant)} ${summary.devise}. ${reste}`
      : `nous avons bien reçu votre paiement de ${formatNumber(summary.montant)} ${summary.devise} (facture ${summary.factureNumero}). ${reste}`;
  const lien = summary.type === 'facture' ? 'Téléchargez votre facture' : 'Votre reçu';
  return `Bonjour ${prenom}, ${corps}\n\n${lien} : ${url}\n\nMerci de votre confiance !\nDSL Air Cargo`;
}

// wa.me exige le numéro au format international, chiffres seulement
export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}
