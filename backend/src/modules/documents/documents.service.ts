import { AppError } from '@/lib/errors';
import { DocumentType, documentUrl, signDocumentToken } from '@/lib/documentLinks';
import { generateFacturePdf, FactureCompletePourPdf } from '@/lib/pdf/facturePdf';
import { generatePaymentReceiptPdf, regleAvant } from '@/lib/pdf/paymentReceipt';
import { getFactureById } from '@/modules/factures/factures.service';
import { getPaiementForReceipt } from '@/modules/paiements/paiements.service';

export class DocumentError extends AppError {}

// Résumé affiché sur la page publique de téléchargement (/document/:token) et utilisé pour
// rédiger le message WhatsApp envoyé au client.
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

export interface DocumentFile {
  buffer: Buffer;
  filename: string;
  summary: DocumentSummary;
}

async function factureDocument(id: string, withPdf: boolean): Promise<DocumentFile> {
  const facture = await getFactureById(id);
  if (!facture) throw new DocumentError('Facture introuvable.', 404);

  const paye = facture.paiements.reduce((s, p) => s + Number(p.montant) * Number(p.tauxVersGnf), 0);
  const summary: DocumentSummary = {
    type: 'facture',
    numero: facture.factureNumber,
    clientNom: facture.client.fullName,
    clientTelephone: facture.client.phoneWhatsapp || facture.client.phoneGn || null,
    date: facture.createdAt.toISOString(),
    montant: Number(facture.montantTotal),
    devise: facture.currency,
    reste: Math.max(0, Number(facture.montantTotal) - paye),
    factureNumero: facture.factureNumber,
  };
  const buffer = withPdf
    ? await generateFacturePdf(facture as FactureCompletePourPdf, { documentUrl: documentUrl('facture', id) })
    : Buffer.alloc(0);
  return { buffer, filename: `facture-${facture.factureNumber}.pdf`, summary };
}

async function recuDocument(id: string, withPdf: boolean): Promise<DocumentFile> {
  const { paiement, agent } = await getPaiementForReceipt(id);
  const { facture } = paiement;
  const numero = `R-${paiement.id.slice(0, 8).toUpperCase()}`;
  const montantGnf = Number(paiement.montant) * Number(paiement.tauxVersGnf);
  const reste = Math.max(0, Number(facture.montantTotal) - regleAvant(paiement, facture.paiements) - montantGnf);

  const summary: DocumentSummary = {
    type: 'recu',
    numero,
    clientNom: facture.client.fullName,
    clientTelephone: facture.client.phoneWhatsapp || facture.client.phoneGn || null,
    date: (paiement.datePaiement ?? paiement.createdAt).toISOString(),
    montant: Number(paiement.montant),
    devise: paiement.currency,
    reste,
    factureNumero: facture.factureNumber,
  };
  const buffer = withPdf
    ? await generatePaymentReceiptPdf({
        paiement,
        facture,
        client: facture.client,
        colis: facture.colis,
        agent,
        documentUrl: documentUrl('recu', id),
      })
    : Buffer.alloc(0);
  return { buffer, filename: `recu-${numero}.pdf`, summary };
}

export function getDocument(type: DocumentType, id: string, withPdf = true): Promise<DocumentFile> {
  return type === 'facture' ? factureDocument(id, withPdf) : recuDocument(id, withPdf);
}

// Lien à envoyer au client (bouton « Envoyer au client » de l'espace agent)
export async function getClientLink(type: DocumentType, id: string) {
  const { summary } = await getDocument(type, id, false);
  return { token: signDocumentToken(type, id), url: documentUrl(type, id), summary };
}
