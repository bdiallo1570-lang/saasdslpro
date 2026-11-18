import PDFDocument from 'pdfkit';
import { montantEnLettres } from '@/lib/montantEnLettres';
import type { DevisDto } from '@/modules/devis/devis.service';
import { COLORS, COMPANY, drawFooters, drawHeader, drawPill, drawQr, formatDate, formatMontant } from './brand';

const MARGIN_X = 40;
const BOTTOM_LIMIT = 841.89 - 78;

export type DevisVariante = 'devis' | 'proforma';

// Devis ou facture proforma (A4) : même contenu, titre et numéro différents. Aucun des deux
// n'est une facture : la mention est imprimée en clair pour éviter toute confusion comptable.
export function generateDevisPdf(
  devis: DevisDto,
  variante: DevisVariante,
  opts: { documentUrl?: string } = {},
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proforma = variante === 'proforma';
    const numero = proforma ? devis.numeroProforma : devis.numero;
    const titre = proforma ? 'Facture proforma' : 'Devis';
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      bufferPages: true,
      info: { Title: `${titre} ${numero}`, Author: COMPANY.name },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - MARGIN_X * 2;
    const dateEmission = formatDate(new Date(devis.createdAt));
    const dateValidite = formatDate(new Date(devis.validUntil));

    drawHeader(doc, { marginX: MARGIN_X, height: 96, kind: titre, number: numero, date: `${proforma ? 'Émise' : 'Émis'} le ${dateEmission}` });

    const newPage = (): number => {
      doc.addPage({ size: 'A4', margin: 0 });
      doc.rect(0, 0, pageWidth, 34).fill(COLORS.ink);
      doc.rect(0, 34, pageWidth, 2).fill(COLORS.ember);
      doc
        .fillColor(COLORS.white)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`${COMPANY.name}  ·  ${titre} ${numero} (suite)`, MARGIN_X, 13, { lineBreak: false });
      return 56;
    };

    let y = 96 + 26;

    // ─── Destinataire + résumé ──────────────────────────────────────────────
    const cardW = (contentWidth - 14) / 2;
    const cardH = 96;
    doc.roundedRect(MARGIN_X, y, cardW, cardH, 8).fill(COLORS.soft);
    label(doc, 'Établi pour', MARGIN_X + 14, y + 12);
    doc
      .fillColor(COLORS.text)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(devis.client.nom, MARGIN_X + 14, y + 26, { width: cardW - 28, lineBreak: false, ellipsis: true });
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8.5).text(`Code client : ${devis.client.code}`, MARGIN_X + 14, y + 43);
    if (devis.client.telephone) doc.text(`Tél. : ${devis.client.telephone}`, MARGIN_X + 14, y + 57);

    const rx = MARGIN_X + cardW + 14;
    doc.roundedRect(rx, y, cardW, cardH, 8).lineWidth(0.8).stroke(COLORS.border);
    label(doc, 'Résumé', rx + 14, y + 12);
    const rows: [string, string][] = [
      ["Date d'émission", dateEmission],
      ["Valable jusqu'au", dateValidite],
      ...(devis.tauxUsdGnf ? ([['Taux USD - GNF', formatMontant(devis.tauxUsdGnf)]] as [string, string][]) : []),
    ];
    rows.forEach(([k, v], i) => {
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8.5).text(k, rx + 14, y + 28 + i * 16);
      doc.fillColor(COLORS.text).font('Helvetica-Bold').text(v, rx + 100, y + 28 + i * 16, { width: cardW - 114, align: 'right' });
    });
    if (devis.expire) drawPill(doc, rx + cardW - 14, y + cardH - 26, 'EXPIRÉ', COLORS.red, COLORS.redSoft, true);

    y += cardH + 26;

    // ─── Lignes ─────────────────────────────────────────────────────────────
    const cols = [
      { key: 'libelle', title: 'Désignation', width: 0, align: 'left' as const },
      { key: 'quantite', title: 'Quantité', width: 78, align: 'right' as const },
      { key: 'pu', title: 'Prix unitaire', width: 92, align: 'right' as const },
      { key: 'montant', title: 'Montant', width: 96, align: 'right' as const },
    ];
    cols[0].width = contentWidth - cols.reduce((s, c) => s + c.width, 0) - 20;

    const drawHead = (top: number) => {
      doc.roundedRect(MARGIN_X, top, contentWidth, 24, 4).fill(COLORS.ink);
      let x = MARGIN_X + 10;
      doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(7.5);
      cols.forEach((c) => {
        doc.text(c.title.toUpperCase(), x, top + 8.5, {
          width: c.width - (c.align === 'right' ? 0 : 6),
          align: c.align,
          characterSpacing: 0.5,
          lineBreak: false,
        });
        x += c.width;
      });
      return top + 24;
    };

    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(11).text('Détail', MARGIN_X, y);
    y = drawHead(y + 18);

    devis.lignes.forEach((l, idx) => {
      const sousLigne = l.prixUnitaireUsd
        ? `${formatMontant(l.prixUnitaireUsd)} USD / m³ au taux de ${formatMontant(devis.tauxUsdGnf ?? 0)} GNF`
        : null;
      doc.font('Helvetica').fontSize(8.5);
      const libH = doc.heightOfString(l.libelle, { width: cols[0].width - 8 });
      const rowH = Math.max(26, libH + (sousLigne ? 11 : 0) + 14);
      if (y + rowH > BOTTOM_LIMIT) y = drawHead(newPage());
      if (idx % 2 === 1) doc.rect(MARGIN_X, y, contentWidth, rowH).fill(COLORS.soft);

      let x = MARGIN_X + 10;
      doc.fillColor(COLORS.text).font('Helvetica').fontSize(8.5).text(l.libelle, x, y + 8.5, { width: cols[0].width - 8 });
      if (sousLigne) {
        doc.fillColor(COLORS.faint).fontSize(7.5).text(sousLigne, x, y + 9.5 + libH, { width: cols[0].width - 8 });
      }
      x += cols[0].width;
      const qte = `${l.quantite.toLocaleString('fr-FR', { maximumFractionDigits: 3 }).replace(/[  ]/g, ' ')} ${l.unite}`;
      doc.fillColor(COLORS.text).font('Helvetica').fontSize(8.5).text(qte, x, y + 8.5, { width: cols[1].width, align: 'right' });
      x += cols[1].width;
      doc.fillColor(COLORS.muted).text(formatMontant(l.prixUnitaire), x, y + 8.5, { width: cols[2].width, align: 'right' });
      x += cols[2].width;
      doc
        .fillColor(COLORS.text)
        .font('Helvetica-Bold')
        .text(`${formatMontant(l.montant)} GNF`, x, y + 8.5, { width: cols[3].width, align: 'right' });
      doc.rect(MARGIN_X, y + rowH, contentWidth, 0.5).fill(COLORS.border);
      y += rowH;
    });

    // ─── Totaux (+ QR code) ─────────────────────────────────────────────────
    if (y + 170 > BOTTOM_LIMIT) y = newPage();
    y += 20;
    const sumW = 236;
    const sumX = MARGIN_X + contentWidth - sumW;
    const sumH = devis.remise > 0 ? 108 : 90;
    doc.roundedRect(sumX, y, sumW, sumH, 8).fill(COLORS.soft);
    let ly = y + 16;
    const ligne = (k: string, v: string, color = COLORS.text) => {
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9).text(k, sumX + 16, ly);
      doc.fillColor(color).font('Helvetica-Bold').text(v, sumX + 16, ly, { width: sumW - 32, align: 'right' });
      ly += 18;
    };
    ligne('Sous-total', `${formatMontant(devis.sousTotal)} GNF`);
    if (devis.remise > 0) ligne('Remise', `- ${formatMontant(devis.remise)} GNF`, COLORS.green);
    doc.rect(sumX + 16, ly + 2, sumW - 32, 0.6).fill(COLORS.border);
    doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(8).text('TOTAL', sumX + 16, ly + 14, { characterSpacing: 0.8 });
    doc
      .fillColor(COLORS.ink)
      .font('Helvetica-Bold')
      .fontSize(18)
      .text(`${formatMontant(devis.total)} GNF`, sumX + 16, ly + 27, { width: sumW - 32, align: 'right' });

    if (opts.documentUrl) {
      drawQr(doc, opts.documentUrl, MARGIN_X + 4, y + 4, 84);
      doc
        .fillColor(COLORS.text)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(proforma ? 'Votre proforma en ligne' : 'Votre devis en ligne', MARGIN_X + 104, y + 16);
      doc
        .fillColor(COLORS.muted)
        .font('Helvetica')
        .fontSize(8)
        .text('Scannez ce code pour retrouver ce document à tout moment.', MARGIN_X + 104, y + 30, {
          width: sumX - (MARGIN_X + 104) - 18,
        });
    }
    y += sumH + 14;

    doc.font('Helvetica-Oblique').fontSize(8);
    const lettres = `Arrêté ${proforma ? 'la présente facture proforma' : 'le présent devis'} à la somme de : ${montantEnLettres(devis.total, 'GNF')}.`;
    doc.fillColor(COLORS.muted).text(lettres, MARGIN_X, y, { width: contentWidth });
    y += doc.heightOfString(lettres, { width: contentWidth }) + 16;

    // ─── Note + conditions ──────────────────────────────────────────────────
    const conditions = [
      ...(devis.note ? [devis.note] : []),
      `${proforma ? 'Facture proforma valable' : 'Devis valable'} jusqu'au ${dateValidite}.`,
      'Montants calculés sur le poids et le volume déclarés : la facture définitive est établie sur le poids réel constaté à la réception à Guangzhou.',
      ...(proforma ? ['Document sans valeur comptable : ne vaut pas facture définitive.'] : []),
      `Pour accepter ${proforma ? 'cette proforma' : 'ce devis'} ou poser une question : WhatsApp ${COMPANY.whatsapp}.`,
    ];
    doc.font('Helvetica').fontSize(8);
    const condH = conditions.reduce((h, t) => h + doc.heightOfString(t, { width: contentWidth - 28 }) + 3, 0) + 30;
    if (y + condH > BOTTOM_LIMIT) y = newPage();
    doc.roundedRect(MARGIN_X, y, contentWidth, condH, 8).lineWidth(0.8).stroke(COLORS.border);
    label(doc, devis.note ? 'Note et conditions' : 'Conditions', MARGIN_X + 14, y + 12);
    let cy = y + 26;
    conditions.forEach((t) => {
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8).text(t, MARGIN_X + 14, cy, { width: contentWidth - 28 });
      cy += doc.heightOfString(t, { width: contentWidth - 28 }) + 3;
    });

    drawFooters(doc, MARGIN_X, [
      `${COMPANY.name}  ·  ${COMPANY.addressGuinee}`,
      `WhatsApp ${COMPANY.whatsapp}  ·  ${COMPANY.website}  ·  ${titre} ${numero} du ${dateEmission}`,
    ]);
    doc.end();
  });
}

function label(doc: PDFKit.PDFDocument, text: string, x: number, y: number) {
  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(7.5).text(text.toUpperCase(), x, y, { characterSpacing: 1 });
}
