import PDFDocument from 'pdfkit';
import { Paiement, Facture, Client } from '@prisma/client';

interface ReceiptData {
  paiement: Paiement;
  facture: Facture;
  client: Client;
}

// Reçu de paiement imprimable (français), remis au client à l'encaissement.
export function generatePaymentReceiptPdf({ paiement, facture, client }: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A5', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text('DSL AIR CARGO', { align: 'center' });
    doc.fontSize(11).text('Reçu de paiement', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Reçu émis le : ${paiement.createdAt.toLocaleString('fr-FR')}`);
    doc.text(`Facture : ${facture.factureNumber}`);
    doc.text(`Client : ${client.fullName} (${client.clientCode})`);
    doc.moveDown();

    doc.fontSize(12).text(
      `Montant reçu : ${Number(paiement.montant).toLocaleString('fr-FR')} ${paiement.currency}`,
      { underline: true },
    );
    doc.fontSize(10).text(`Mode de paiement : ${formatMethod(paiement.method)}`);
    doc.text(
      `Taux appliqué (vers GNF) : ${Number(paiement.tauxVersGnf).toLocaleString('fr-FR')}`,
    );
    doc.moveDown();

    doc.text(`Montant total facture : ${Number(facture.montantTotal).toLocaleString('fr-FR')} ${facture.currency}`);
    doc.text(`Statut facture : ${formatFactureStatus(facture.status)}`);

    doc.moveDown(2);
    doc.fontSize(8).fillColor('gray').text('Merci de votre confiance — DSL Air Cargo', { align: 'center' });

    doc.end();
  });
}

function formatMethod(method: string) {
  switch (method) {
    case 'ESPECES':
      return 'Espèces';
    case 'ORANGE_MONEY':
      return 'Orange Money';
    case 'MTN_MOMO':
      return 'MTN Mobile Money';
    case 'VIREMENT':
      return 'Virement bancaire';
    case 'AUTRE':
      return 'Autre';
    default:
      return method;
  }
}

function formatFactureStatus(status: string) {
  switch (status) {
    case 'PAYE':
      return 'Payée intégralement';
    case 'PARTIEL':
      return 'Paiement partiel';
    case 'IMPAYE':
      return 'Impayée';
    default:
      return status;
  }
}
