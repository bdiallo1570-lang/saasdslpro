import PDFDocument from 'pdfkit';
import { Facture, Client, Colis, Paiement, PricingRule, Lot } from '@prisma/client';
import {
  COLORS,
  COMPANY,
  drawFooters,
  drawHeader,
  drawPill,
  drawQr,
  formatDate,
  formatKg,
  formatMethod,
  formatMontant,
} from './brand';

export type FactureCompletePourPdf = Facture & {
  client: Client;
  colis: (Colis & { pricingRule?: PricingRule | null; lot?: Lot | null })[];
  paiements: Paiement[];
};

const MARGIN_X = 40;
// Bas utile d'une page : au-delà, la ligne suivante passe sur une nouvelle page (pied réservé)
const BOTTOM_LIMIT = 841.89 - 78;

// Facture A4 remise au client : en-tête, destinataire, détail des colis (sur plusieurs pages si
// besoin, en-tête du tableau répété), synthèse dû / payé / reste, historique des règlements, QR
// code vers le lien de téléchargement personnel du client.
export function generateFacturePdf(
  facture: FactureCompletePourPdf,
  opts: { documentUrl?: string } = {},
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      bufferPages: true,
      info: { Title: `Facture ${facture.factureNumber}`, Author: COMPANY.name },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - MARGIN_X * 2;
    const dateEmission = formatDate(new Date(facture.createdAt));

    const montantTotal = Number(facture.montantTotal);
    const totalPaye = facture.paiements.reduce((sum, p) => sum + Number(p.montant) * Number(p.tauxVersGnf), 0);
    const reste = Math.max(0, montantTotal - totalPaye);

    drawHeader(doc, {
      marginX: MARGIN_X,
      height: 96,
      kind: 'Facture',
      number: facture.factureNumber,
      date: `Émise le ${dateEmission}`,
    });

    // Nouvelle page : petit bandeau de rappel, puis on reprend sous celui-ci
    const newPage = (): number => {
      doc.addPage({ size: 'A4', margin: 0 });
      doc.rect(0, 0, pageWidth, 34).fill(COLORS.ink);
      doc.rect(0, 34, pageWidth, 2).fill(COLORS.ember);
      doc
        .fillColor(COLORS.white)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`${COMPANY.name}  ·  Facture ${facture.factureNumber} (suite)`, MARGIN_X, 13, { lineBreak: false });
      return 56;
    };

    let y = 96 + 26;

    // ─── Destinataire + résumé ──────────────────────────────────────────────
    const cardW = (contentWidth - 14) / 2;
    const cardH = 104;
    const client = facture.client;

    doc.roundedRect(MARGIN_X, y, cardW, cardH, 8).fill(COLORS.soft);
    label(doc, 'Facturé à', MARGIN_X + 14, y + 12);
    doc
      .fillColor(COLORS.text)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(client.fullName, MARGIN_X + 14, y + 26, { width: cardW - 28, lineBreak: false, ellipsis: true });
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8.5).text(`Code client : ${client.clientCode}`, MARGIN_X + 14, y + 43);
    const phones = [
      client.phoneWhatsapp ? `WhatsApp : ${client.phoneWhatsapp}` : null,
      client.phoneGn && client.phoneGn !== client.phoneWhatsapp ? `Tél. : ${client.phoneGn}` : null,
      client.phoneCn ? `Chine : ${client.phoneCn}` : null,
    ].filter(Boolean) as string[];
    doc.text(phones.join('   ') || 'Aucun numéro renseigné', MARGIN_X + 14, y + 57, { width: cardW - 28 });
    if (client.address) {
      doc.text(client.address, MARGIN_X + 14, y + 71, { width: cardW - 28, height: 26, ellipsis: true });
    }

    const rx = MARGIN_X + cardW + 14;
    doc.roundedRect(rx, y, cardW, cardH, 8).lineWidth(0.8).stroke(COLORS.border);
    label(doc, 'Résumé', rx + 14, y + 12);
    const poidsTotal = facture.colis.reduce((s, c) => s + Number(c.poidsReelKg), 0);
    const lots = [
      ...new Set(
        facture.colis
          .map((c) => (c.lot ? [c.lot.lotNumber, c.lot.flightNumber].filter(Boolean).join(' · ') : null))
          .filter(Boolean),
      ),
    ];
    const rows: [string, string][] = [
      ["Date d'émission", dateEmission],
      ['Colis', `${facture.colis.length}  (${formatKg(poidsTotal)})`],
      ['Lot / vol', lots.join(', ') || '-'],
    ];
    rows.forEach(([k, v], i) => {
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8.5).text(k, rx + 14, y + 28 + i * 16);
      doc
        .fillColor(COLORS.text)
        .font('Helvetica-Bold')
        .text(v, rx + 100, y + 28 + i * 16, { width: cardW - 114, align: 'right', lineBreak: false, ellipsis: true });
    });
    const status =
      reste <= 0
        ? { text: 'PAYÉE', color: COLORS.green, bg: COLORS.greenSoft }
        : totalPaye > 0
          ? { text: 'PAIEMENT PARTIEL', color: COLORS.emberDark, bg: COLORS.amberSoft }
          : { text: 'À PAYER', color: COLORS.red, bg: COLORS.redSoft };
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8.5).text('Statut', rx + 14, y + 80);
    drawPill(doc, rx + cardW - 14, y + 76, status.text, status.color, status.bg, true);

    y += cardH + 26;

    // ─── Détail des colis ───────────────────────────────────────────────────
    // La colonne « Poids vol. » n'apparaît que si au moins un colis a été mesuré
    const avecVolumetrique = facture.colis.some((c) => Number(c.poidsVolumetriqueKg) > 0);
    const cols = [
      { key: 'tracking', title: 'N° de suivi', width: 92, align: 'left' as const },
      { key: 'desc', title: 'Description', width: 0, align: 'left' as const },
      ...(avecVolumetrique ? [{ key: 'vol', title: 'Poids vol.', width: 62, align: 'right' as const }] : []),
      { key: 'poids', title: 'Poids', width: 62, align: 'right' as const },
      { key: 'pu', title: 'Tarif / kg', width: 72, align: 'right' as const },
      { key: 'total', title: 'Montant', width: 88, align: 'right' as const },
    ];
    cols[1].width = contentWidth - cols.reduce((s, c) => s + c.width, 0) - 20;

    const drawTableHead = (top: number) => {
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

    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(11).text('Détail des colis', MARGIN_X, y);
    y = drawTableHead(y + 18);

    facture.colis.forEach((c, idx) => {
      const poids = Number(c.poidsReelKg);
      const montant = Number(c.montantEstime);
      const pu = c.pricingRule ? Number(c.pricingRule.pricePerKg) : Math.round(montant / (poids || 1));
      doc.font('Helvetica').fontSize(8.5);
      const descH = doc.heightOfString(c.description || '-', { width: cols[1].width - 8 });
      const rowH = Math.max(26, descH + 14);

      if (y + rowH > BOTTOM_LIMIT) y = drawTableHead(newPage());

      if (idx % 2 === 1) doc.rect(MARGIN_X, y, contentWidth, rowH).fill(COLORS.soft);
      const cells: Record<string, string> = {
        tracking: c.trackingId,
        desc: c.description || '-',
        vol: Number(c.poidsVolumetriqueKg) > 0 ? formatKg(Number(c.poidsVolumetriqueKg)) : '-',
        poids: formatKg(poids),
        pu: formatMontant(pu),
        total: `${formatMontant(montant)} GNF`,
      };
      let x = MARGIN_X + 10;
      cols.forEach((col) => {
        const bold = col.key === 'tracking' || col.key === 'total';
        doc
          .fillColor(col.key === 'desc' || col.key === 'vol' || col.key === 'pu' ? COLORS.muted : COLORS.text)
          .font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8.5)
          .text(cells[col.key], x, y + 8.5, { width: col.width - (col.align === 'right' ? 0 : 8), align: col.align });
        x += col.width;
      });
      doc.rect(MARGIN_X, y + rowH, contentWidth, 0.5).fill(COLORS.border);
      y += rowH;
    });

    // ─── Synthèse (+ QR code à gauche) ──────────────────────────────────────
    if (y + 150 > BOTTOM_LIMIT) y = newPage();
    y += 20;
    const sumW = 236;
    const sumX = MARGIN_X + contentWidth - sumW;
    const sumH = 116;
    doc.roundedRect(sumX, y, sumW, sumH, 8).fill(COLORS.soft);
    const line = (k: string, v: string, top: number, color = COLORS.text) => {
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9).text(k, sumX + 16, top);
      doc.fillColor(color).font('Helvetica-Bold').text(v, sumX + 16, top, { width: sumW - 32, align: 'right' });
    };
    line('Total facturé', `${formatMontant(montantTotal)} GNF`, y + 16);
    line('Déjà payé', `${formatMontant(totalPaye)} GNF`, y + 34, COLORS.green);
    doc.rect(sumX + 16, y + 56, sumW - 32, 0.6).fill(COLORS.border);
    doc
      .fillColor(COLORS.muted)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('RESTE À PAYER', sumX + 16, y + 68, { characterSpacing: 0.8 });
    doc
      .fillColor(reste > 0 ? COLORS.red : COLORS.green)
      .font('Helvetica-Bold')
      .fontSize(18)
      .text(reste > 0 ? `${formatMontant(reste)} GNF` : 'Soldée', sumX + 16, y + 82, { width: sumW - 32, align: 'right' });

    if (opts.documentUrl) {
      drawQr(doc, opts.documentUrl, MARGIN_X + 4, y + 4, 92);
      doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(9).text('Votre facture en ligne', MARGIN_X + 112, y + 18);
      doc
        .fillColor(COLORS.muted)
        .font('Helvetica')
        .fontSize(8)
        .text(
          'Scannez ce code avec votre téléphone pour retrouver et télécharger cette facture à tout moment. Lien personnel et sécurisé.',
          MARGIN_X + 112,
          y + 32,
          { width: sumX - (MARGIN_X + 112) - 18 },
        );
    }
    y += sumH + 26;

    // ─── Historique des règlements ──────────────────────────────────────────
    if (facture.paiements.length > 0) {
      if (y + 70 > BOTTOM_LIMIT) y = newPage();
      doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(11).text('Règlements reçus', MARGIN_X, y);
      y += 20;
      facture.paiements.forEach((p) => {
        if (y + 22 > BOTTOM_LIMIT) y = newPage();
        const date = formatDate(new Date(p.datePaiement ?? p.createdAt));
        const gnf = Number(p.montant) * Number(p.tauxVersGnf);
        const detail = [formatMethod(p.method), p.reference ? `Réf. ${p.reference}` : null].filter(Boolean).join('  ·  ');
        doc.fillColor(COLORS.text).font('Helvetica').fontSize(8.5).text(date, MARGIN_X, y + 6, { width: 130 });
        doc
          .fillColor(COLORS.muted)
          .text(detail, MARGIN_X + 130, y + 6, { width: contentWidth - 130 - 140, lineBreak: false, ellipsis: true });
        doc
          .fillColor(COLORS.green)
          .font('Helvetica-Bold')
          .text(`${formatMontant(gnf)} GNF`, MARGIN_X, y + 6, { width: contentWidth, align: 'right' });
        doc.rect(MARGIN_X, y + 22, contentWidth, 0.5).fill(COLORS.border);
        y += 22;
      });
      y += 20;
    }

    // ─── Conditions ─────────────────────────────────────────────────────────
    const conditions = [
      `Règlements acceptés en espèces à l'entrepôt de Madina, par Orange Money (${COMPANY.whatsapp}) ou par virement bancaire.`,
      'Les colis sont remis après règlement intégral du montant dû. Présentez cette facture ou votre code client au retrait.',
      `Une question ? Écrivez-nous sur WhatsApp au ${COMPANY.whatsapp}.`,
    ];
    doc.font('Helvetica').fontSize(8);
    const condH = conditions.reduce((h, t) => h + doc.heightOfString(t, { width: contentWidth - 28 }) + 3, 0) + 30;
    if (y + condH > BOTTOM_LIMIT) y = newPage();
    doc.roundedRect(MARGIN_X, y, contentWidth, condH, 8).lineWidth(0.8).stroke(COLORS.border);
    label(doc, 'Conditions', MARGIN_X + 14, y + 12);
    let cy = y + 26;
    conditions.forEach((t) => {
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8).text(t, MARGIN_X + 14, cy, { width: contentWidth - 28 });
      cy += doc.heightOfString(t, { width: contentWidth - 28 }) + 3;
    });

    drawFooters(doc, MARGIN_X, [
      `${COMPANY.name}  ·  ${COMPANY.addressGuinee}`,
      `WhatsApp ${COMPANY.whatsapp}  ·  ${COMPANY.website}  ·  Facture ${facture.factureNumber} du ${dateEmission}`,
    ]);
    doc.end();
  });
}

function label(doc: PDFKit.PDFDocument, text: string, x: number, y: number) {
  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(7.5).text(text.toUpperCase(), x, y, { characterSpacing: 1 });
}
