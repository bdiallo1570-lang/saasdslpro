import PDFDocument from 'pdfkit';
import { CashRegisterClosure, CashTransaction } from '@prisma/client';

type ClosureWithTransactions = CashRegisterClosure & { transactions: CashTransaction[] };

// Génère le Rapport de Clôture de caisse (PDF, français) — module Caisse Madina.
export function generateClosureReportPdf(closure: ClosureWithTransactions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('DSL AIR CARGO', { align: 'center' });
    doc.fontSize(12).text('Rapport de Clôture de Caisse', { align: 'center' });
    doc.moveDown();

    doc
      .fontSize(10)
      .text(`Date : ${closure.date.toLocaleDateString('fr-FR')}`)
      .text(`Devise : ${closure.currency}`)
      .text(`Statut : ${closure.status === 'CLOTUREE' ? 'Clôturée' : 'Ouverte'}`);
    doc.moveDown();

    const entrees = closure.transactions.filter((t) => t.type === 'ENTREE');
    const depenses = closure.transactions.filter((t) => t.type === 'DEPENSE');
    const totalEntrees = entrees.reduce((s, t) => s + Number(t.montant), 0);
    const totalDepenses = depenses.reduce((s, t) => s + Number(t.montant), 0);

    doc.fontSize(12).text('Résumé', { underline: true });
    doc.fontSize(10);
    doc.text(`Fond d'ouverture : ${Number(closure.fondOuverture).toLocaleString('fr-FR')} ${closure.currency}`);
    doc.text(`Total entrées : ${totalEntrees.toLocaleString('fr-FR')} ${closure.currency}`);
    doc.text(`Total dépenses : ${totalDepenses.toLocaleString('fr-FR')} ${closure.currency}`);
    doc.text(
      `Solde théorique : ${Number(closure.soldeTheorique ?? 0).toLocaleString('fr-FR')} ${closure.currency}`,
    );
    if (closure.comptagePhysique !== null) {
      doc.text(
        `Comptage physique : ${Number(closure.comptagePhysique).toLocaleString('fr-FR')} ${closure.currency}`,
      );
      const ecart = Number(closure.ecart ?? 0);
      doc.fillColor(ecart === 0 ? 'black' : ecart > 0 ? 'green' : 'red');
      doc.text(`Écart : ${ecart >= 0 ? '+' : ''}${ecart.toLocaleString('fr-FR')} ${closure.currency}`);
      doc.fillColor('black');
    }
    doc.moveDown();

    doc.fontSize(12).text('Détail des transactions', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(9);
    for (const t of closure.transactions) {
      const sign = t.type === 'ENTREE' ? '+' : '-';
      doc.text(
        `${t.createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}  ` +
          `${sign} ${Number(t.montant).toLocaleString('fr-FR')} ${t.currency}  —  ${t.label}` +
          (t.category ? ` (${t.category})` : '') +
          (t.method ? ` [${t.method}]` : ''),
      );
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor('gray').text('DSL Air Cargo — Conakry, Guinée', { align: 'center' });

    doc.end();
  });
}
