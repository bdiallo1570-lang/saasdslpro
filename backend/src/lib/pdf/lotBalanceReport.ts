import PDFDocument from 'pdfkit';
import { RentabiliteLot } from '@/modules/lots/rentabilite/rentabilite.service';

const LABELS_CATEGORIE: Record<string, string> = {
  DEDOUANEMENT: 'Dédouanement',
  TRANSPORT_AEROPORT_MADINA: 'Transport aéroport → Madina',
  MANUTENTION: 'Manutention',
  STOCKAGE: 'Stockage',
  DOCUMENTATION: 'Documentation',
  DIVERS: 'Divers',
};

// Bilan de lot imprimable (français) — compte de résultat complet, module Agent Guinée.
export function generateLotBalanceReportPdf(rentabilite: RentabiliteLot): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('DSL AIR CARGO', { align: 'center' });
    doc.fontSize(12).text(`Bilan du lot ${rentabilite.lotNumber}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text('Revenus', { underline: true });
    doc.fontSize(10);
    doc.text(`CA facturé : ${Math.round(rentabilite.revenus.caFactureGnf).toLocaleString('fr-FR')} GNF`);
    doc.text(`Encaissements réels : ${Math.round(rentabilite.revenus.encaissementsGnf).toLocaleString('fr-FR')} GNF`);
    doc.text(`Créances en cours : ${Math.round(rentabilite.revenus.creancesEnCoursGnf).toLocaleString('fr-FR')} GNF`);
    doc.moveDown();

    doc.fontSize(12).text('Dépenses', { underline: true });
    doc.fontSize(10);
    for (const d of rentabilite.depenses.parCategorie) {
      doc.text(`${LABELS_CATEGORIE[d.categorie] ?? d.categorie} : ${Math.round(d.totalGnf).toLocaleString('fr-FR')} GNF`);
    }
    doc.fontSize(10).text(`Total dépenses : ${Math.round(rentabilite.depenses.totalGnf).toLocaleString('fr-FR')} GNF`, {
      underline: true,
    });
    doc.moveDown();

    doc.fontSize(12).text('Résultats', { underline: true });
    doc.fontSize(10);
    const margeBrute = Math.round(rentabilite.resultats.margeBruteGnf);
    doc.fillColor(margeBrute >= 0 ? 'green' : 'red');
    doc.text(`Marge brute théorique : ${margeBrute >= 0 ? '+' : ''}${margeBrute.toLocaleString('fr-FR')} GNF`);
    doc.fillColor('black');
    doc.text(`Marge encaissée (trésorerie) : ${Math.round(rentabilite.resultats.margeEncaisseeGnf).toLocaleString('fr-FR')} GNF`);
    doc.text(`Taux de marge : ${rentabilite.resultats.tauxMargePourcent.toFixed(1)} %`);
    doc.text(`Coût de revient / kg : ${Math.round(rentabilite.resultats.coutRevientParKgGnf).toLocaleString('fr-FR')} GNF`);
    doc.text(`Marge / kg : ${Math.round(rentabilite.resultats.margeParKgGnf).toLocaleString('fr-FR')} GNF`);

    doc.moveDown(2);
    doc.fontSize(8).fillColor('gray').text('DSL Air Cargo — Conakry, Guinée', { align: 'center' });

    doc.end();
  });
}
