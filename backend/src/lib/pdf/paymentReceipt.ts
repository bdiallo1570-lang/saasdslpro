import PDFDocument from 'pdfkit';
import { Paiement, Facture, Client, Colis, User } from '@prisma/client';
import { montantEnLettres } from '@/lib/montantEnLettres';
import {
  COLORS,
  COMPANY,
  drawFooters,
  drawHeader,
  drawPill,
  drawQr,
  formatDate,
  formatMethod,
  formatMontant,
} from './brand';

interface ReceiptData {
  paiement: Paiement;
  // Tous les règlements (non supprimés) de la facture : la situation affichée est celle du
  // moment de CE paiement, pas l'état actuel de la facture.
  facture: Facture & { paiements: Paiement[] };
  client: Client;
  colis: Colis[];
  agent: User | null;
  documentUrl?: string;
}

const MARGIN_X = 30;
const MAX_COLIS = 5;

// Montant d'un règlement en GNF, au taux figé au moment du paiement
const enGnf = (p: Paiement) => Number(p.montant) * Number(p.tauxVersGnf);

// Ce qui avait déjà été réglé sur la facture avant ce paiement (ordre d'encaissement)
export function regleAvant(paiement: Paiement, paiements: Paiement[]): number {
  const ordre = [...paiements].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() || a.id.localeCompare(b.id),
  );
  const index = ordre.findIndex((p) => p.id === paiement.id);
  const precedents =
    index >= 0 ? ordre.slice(0, index) : ordre.filter((p) => new Date(p.createdAt) < new Date(paiement.createdAt));
  return precedents.reduce((s, p) => s + enGnf(p), 0);
}

// Reçu de paiement A5 remis au client à l'encaissement : montant reçu (en chiffres et en
// lettres), situation de la facture à cet instant (réglé avant, ce paiement, reste à payer),
// colis concernés, agent qui a encaissé, QR code vers le lien de téléchargement du client.
export function generatePaymentReceiptPdf({
  paiement,
  facture,
  client,
  colis,
  agent,
  documentUrl,
}: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const numero = `R-${paiement.id.slice(0, 8).toUpperCase()}`;
    const doc = new PDFDocument({
      size: 'A5',
      margin: 0,
      bufferPages: true,
      info: { Title: `Reçu ${numero}`, Author: COMPANY.name },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - MARGIN_X * 2;
    const datePaiement = new Date(paiement.datePaiement ?? paiement.createdAt);

    const montantGnf = enGnf(paiement);
    const totalFacture = Number(facture.montantTotal);
    const avant = regleAvant(paiement, facture.paiements);
    const resteApres = Math.max(0, totalFacture - avant - montantGnf);

    drawHeader(doc, {
      marginX: MARGIN_X,
      height: 82,
      kind: 'Reçu de paiement',
      number: numero,
      date: formatDate(datePaiement, true),
    });

    let y = 82 + 20;

    // ─── Client ─────────────────────────────────────────────────────────────
    doc.roundedRect(MARGIN_X, y, contentWidth, 50, 8).fill(COLORS.soft);
    label(doc, 'Reçu de', MARGIN_X + 12, y + 10);
    doc
      .fillColor(COLORS.text)
      .font('Helvetica-Bold')
      .fontSize(11.5)
      .text(client.fullName, MARGIN_X + 12, y + 22, { width: contentWidth - 24, lineBreak: false, ellipsis: true });
    const phone = client.phoneWhatsapp || client.phoneGn;
    doc
      .fillColor(COLORS.muted)
      .font('Helvetica')
      .fontSize(8)
      .text(
        [`Code client : ${client.clientCode}`, phone ? `Tél. : ${phone}` : null].filter(Boolean).join('   ·   '),
        MARGIN_X + 12,
        y + 37,
      );
    y += 50 + 14;

    // ─── Montant reçu ───────────────────────────────────────────────────────
    const devise = paiement.currency;
    const enLettres = `Arrêté le présent reçu à la somme de : ${montantEnLettres(Number(paiement.montant), devise)}.`;
    doc.font('Helvetica-Oblique').fontSize(7.5);
    const lettresH = doc.heightOfString(enLettres, { width: contentWidth - 28 });
    const blocH = 74 + lettresH;
    doc.roundedRect(MARGIN_X, y, contentWidth, blocH, 10).fill(COLORS.ink);
    doc
      .fillColor(COLORS.ember)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('MONTANT REÇU', MARGIN_X + 14, y + 14, { characterSpacing: 1.2 });
    doc
      .fillColor(COLORS.white)
      .font('Helvetica-Bold')
      .fontSize(24)
      .text(`${formatMontant(Number(paiement.montant))} ${devise}`, MARGIN_X + 14, y + 28, { lineBreak: false });
    const modeLigne = [formatMethod(paiement.method), paiement.reference ? `Réf. ${paiement.reference}` : null]
      .filter(Boolean)
      .join('  ·  ');
    doc
      .fillColor(COLORS.faint)
      .font('Helvetica')
      .fontSize(8)
      .text(modeLigne, MARGIN_X + 14, y + 20, { width: contentWidth - 28, align: 'right' });
    if (devise !== 'GNF') {
      doc.text(
        `Soit ${formatMontant(montantGnf)} GNF (taux ${formatMontant(Number(paiement.tauxVersGnf))})`,
        MARGIN_X + 14,
        y + 34,
        { width: contentWidth - 28, align: 'right' },
      );
    }
    doc
      .fillColor(COLORS.faint)
      .font('Helvetica-Oblique')
      .fontSize(7.5)
      .text(enLettres, MARGIN_X + 14, y + 62, { width: contentWidth - 28 });
    y += blocH + 16;

    // ─── Situation de la facture au moment de ce paiement ───────────────────
    label(doc, `Facture ${facture.factureNumber}`, MARGIN_X, y);
    y += 14;
    const ligne = (k: string, v: string, color = COLORS.text, bold = false) => {
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8.5).text(k, MARGIN_X, y);
      doc
        .fillColor(color)
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(v, MARGIN_X, y, { width: contentWidth, align: 'right' });
      y += 15;
    };
    ligne('Montant de la facture', `${formatMontant(totalFacture)} GNF`);
    ligne('Déjà réglé avant ce paiement', `${formatMontant(avant)} GNF`);
    ligne('Ce paiement', `+ ${formatMontant(montantGnf)} GNF`, COLORS.green, true);
    doc.rect(MARGIN_X, y + 1, contentWidth, 0.6).fill(COLORS.border);
    y += 9;
    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(9.5).text('Reste à payer', MARGIN_X, y + 4);
    if (resteApres > 0) {
      drawPill(doc, MARGIN_X + contentWidth, y, `${formatMontant(resteApres)} GNF`, COLORS.red, COLORS.redSoft, true);
    } else {
      drawPill(doc, MARGIN_X + contentWidth, y, 'FACTURE SOLDÉE', COLORS.green, COLORS.greenSoft, true);
    }
    y += 32;

    // ─── Colis concernés ────────────────────────────────────────────────────
    // Autant de lignes que la place le permet au-dessus du bloc « Encaissé par » (le reste est
    // sur la facture) : le reçu tient toujours sur une seule page A5.
    const blocBasH = 82;
    const footerTop = doc.page.height - 56;
    if (colis.length > 0) {
      label(doc, `Colis concernés (${colis.length})`, MARGIN_X, y);
      y += 14;
      const place = Math.floor((footerTop - blocBasH - 12 - y - 12) / 13);
      const visibles = colis.length <= place ? colis.length : Math.max(1, Math.min(MAX_COLIS, place - 1));
      colis.slice(0, visibles).forEach((c) => {
        doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(8).text(c.trackingId, MARGIN_X, y, { width: 100 });
        doc
          .fillColor(COLORS.muted)
          .font('Helvetica')
          .text(c.description || '-', MARGIN_X + 102, y, { width: contentWidth - 102 - 92, height: 10, ellipsis: true });
        doc
          .fillColor(COLORS.text)
          .text(`${formatMontant(Number(c.montantEstime))} GNF`, MARGIN_X, y, { width: contentWidth, align: 'right' });
        y += 13;
      });
      if (colis.length > visibles) {
        doc
          .fillColor(COLORS.faint)
          .font('Helvetica-Oblique')
          .fontSize(7.5)
          .text(`+ ${colis.length - visibles} autre(s) colis, détaillés sur la facture ${facture.factureNumber}`, MARGIN_X, y);
        y += 12;
      }
    }

    // ─── Encaissé par + QR code (bas de page) ───────────────────────────────
    const blockY = Math.max(y + 12, footerTop - blocBasH);
    label(doc, 'Encaissé par', MARGIN_X, blockY);
    doc
      .fillColor(COLORS.text)
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text(agent?.fullName ?? COMPANY.name, MARGIN_X, blockY + 13, { width: contentWidth - 90 });
    doc
      .fillColor(COLORS.muted)
      .font('Helvetica')
      .fontSize(8)
      .text(
        agent?.phoneNumber ? `Tél. / WhatsApp : ${agent.phoneNumber}` : `WhatsApp : ${COMPANY.whatsapp}`,
        MARGIN_X,
        blockY + 27,
      );
    doc
      .fillColor(COLORS.faint)
      .font('Helvetica-Oblique')
      .fontSize(7.5)
      .text('Merci de votre confiance. Ce reçu fait foi de paiement.', MARGIN_X, blockY + 44, { width: contentWidth - 90 });
    if (documentUrl) {
      drawQr(doc, documentUrl, MARGIN_X + contentWidth - 60, blockY, 60);
      doc
        .fillColor(COLORS.faint)
        .font('Helvetica')
        .fontSize(6)
        .text('Reçu en ligne', MARGIN_X + contentWidth - 66, blockY + 66, { width: 72, align: 'center' });
    }

    drawFooters(doc, MARGIN_X, [
      `${COMPANY.name}  ·  ${COMPANY.addressCourte}`,
      `WhatsApp ${COMPANY.whatsapp}  ·  ${COMPANY.website}`,
    ]);
    doc.end();
  });
}

function label(doc: PDFKit.PDFDocument, text: string, x: number, y: number) {
  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(7).text(text.toUpperCase(), x, y, { characterSpacing: 1 });
}
