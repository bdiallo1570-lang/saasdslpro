import PDFDocument from 'pdfkit';
import { join } from 'node:path';
import { Paiement, Facture, Client, Colis, User } from '@prisma/client';

// toLocaleString('fr-FR') utilise U+202F (espace fine insécable) comme séparateur de milliers,
// absent de l'encodage WinAnsi standard des polices pdfkit — il s'affiche en "/" dans le PDF.
// On le remplace par un espace normal, seul caractère supporté nativement.
function formatMontant(value: number): string {
  return value.toLocaleString('fr-FR').replace(/ /g, ' ');
}

interface ReceiptData {
  paiement: Paiement;
  facture: Facture;
  client: Client;
  colis: Colis[];
  agent: User | null;
}

const LOGO_PATH = join(__dirname, '..', '..', 'assets', 'dsl-logo.png');

// Palette reprise de l'identité visuelle du site (sky/night/cargo) — voir tailwind.config.js.
const COLOR_NIGHT = '#0f172a';
const COLOR_SKY = '#0ea5e9';
const COLOR_CARGO = '#f97316';
const COLOR_SLATE = '#64748b';
const COLOR_SLATE_LIGHT = '#94a3b8';
const COLOR_BORDER = '#e2e8f0';
const COLOR_BG_SOFT = '#f8fafc';
const COLOR_WHITE = '#ffffff';
const COLOR_GREEN = '#059669';

// Coordonnées de l'entreprise — reprises de la landing page (Footer.tsx / WarehousesSection.tsx).
const COMPANY = {
  name: 'DSL Air Cargo',
  // "→" (U+2192) n'est pas dans l'encodage WinAnsi des polices standard pdfkit — "-" reste lisible.
  tagline: 'Fret aérien Chine - Guinée',
  addressGuinee: 'Madina, Gare voitures Liberia, en face du Centre Ariboyah, Centre Sidy, 2ème étage, Boutique C6, Conakry',
  whatsapp: '+224 628 67 48 95',
  website: 'www.dslcargo.com',
};

// Reçu de paiement professionnel (A5, français), remis au client à l'encaissement — en-tête avec
// logo et identité entreprise, détail des colis facturés, montant reçu, et contact direct de
// l'agent Guinée qui a encaissé le paiement (traçabilité + confiance client).
export function generatePaymentReceiptPdf({ paiement, facture, client, colis, agent }: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A5', margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const marginX = 36;
    const contentWidth = pageWidth - marginX * 2;

    // ─── En-tête ────────────────────────────────────────────────────────────
    const headerHeight = 92;
    doc.rect(0, 0, pageWidth, headerHeight).fill(COLOR_NIGHT);

    try {
      doc.image(LOGO_PATH, marginX, 20, { width: 52, height: 52 });
    } catch {
      // Logo indisponible (environnement sans le fichier) — le reçu reste lisible sans lui.
    }

    doc
      .fillColor(COLOR_WHITE)
      .fontSize(19)
      .font('Helvetica-Bold')
      .text(COMPANY.name, marginX + 64, 26);
    doc
      .fillColor(COLOR_SKY)
      .fontSize(9)
      .font('Helvetica')
      .text(COMPANY.tagline.toUpperCase(), marginX + 64, 49, { characterSpacing: 0.6 });

    doc
      .fillColor(COLOR_SLATE_LIGHT)
      .fontSize(7.5)
      .font('Helvetica')
      .text(COMPANY.addressGuinee, marginX + 64, 66, { width: contentWidth - 64 });

    // Bandeau "REÇU DE PAIEMENT"
    doc
      .fillColor(COLOR_CARGO)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('REÇU DE PAIEMENT', marginX, headerHeight - 22, {
        width: contentWidth,
        align: 'right',
        characterSpacing: 1,
      });

    let y = headerHeight + 18;

    // ─── Bloc N° reçu / date / facture ─────────────────────────────────────
    doc.fillColor(COLOR_SLATE).fontSize(8).font('Helvetica');
    doc.text(`Reçu N° ${paiement.id.slice(0, 8).toUpperCase()}`, marginX, y);
    doc.text(paiement.createdAt.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }), marginX, y, {
      width: contentWidth,
      align: 'right',
    });
    y += 22;

    // ─── Bloc informations client ──────────────────────────────────────────
    const clientBoxHeight = 58;
    doc.roundedRect(marginX, y, contentWidth, clientBoxHeight, 6).fill(COLOR_BG_SOFT);
    doc
      .fillColor(COLOR_SLATE)
      .fontSize(7)
      .font('Helvetica-Bold')
      .text('CLIENT', marginX + 14, y + 10, { characterSpacing: 0.5 });
    doc
      .fillColor(COLOR_NIGHT)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(client.fullName, marginX + 14, y + 22);
    doc
      .fillColor(COLOR_SLATE)
      .fontSize(8.5)
      .font('Helvetica')
      .text(
        `Code client : ${client.clientCode}${client.phoneWhatsapp ? '   ·   Tél : ' + client.phoneWhatsapp : client.phoneGn ? '   ·   Tél : ' + client.phoneGn : ''}`,
        marginX + 14,
        y + 39,
      );
    y += clientBoxHeight + 16;

    // ─── Tableau des colis facturés ─────────────────────────────────────────
    doc
      .fillColor(COLOR_SLATE)
      .fontSize(7)
      .font('Helvetica-Bold')
      .text(`COLIS FACTURÉS (${colis.length})`, marginX, y, { characterSpacing: 0.5 });
    y += 14;

    const colTracking = marginX;
    const colDesc = marginX + 90;
    const colMontant = marginX + contentWidth - 90;

    doc.fontSize(7.5).fillColor(COLOR_SLATE_LIGHT).font('Helvetica-Bold');
    doc.text('N° SUIVI', colTracking, y);
    doc.text('DESCRIPTION', colDesc, y);
    doc.text('MONTANT', colMontant, y, { width: 90, align: 'right' });
    y += 12;
    doc.moveTo(marginX, y).lineTo(marginX + contentWidth, y).strokeColor(COLOR_BORDER).lineWidth(0.75).stroke();
    y += 6;

    doc.font('Helvetica').fontSize(8.5);
    for (const c of colis) {
      const rowStartY = y;
      doc.fillColor(COLOR_NIGHT).text(c.trackingId, colTracking, y, { width: 84 });
      doc.fillColor(COLOR_SLATE).text(c.description, colDesc, y, { width: colMontant - colDesc - 8 });
      doc
        .fillColor(COLOR_NIGHT)
        .text(`${formatMontant(Number(c.montantEstime))} ${facture.currency}`, colMontant, y, {
          width: 90,
          align: 'right',
        });
      const rowHeight = Math.max(doc.heightOfString(c.description, { width: colMontant - colDesc - 8 }), 12);
      y = rowStartY + rowHeight + 8;
    }

    doc.moveTo(marginX, y).lineTo(marginX + contentWidth, y).strokeColor(COLOR_BORDER).lineWidth(0.75).stroke();
    y += 12;

    // ─── Montant reçu (bloc mis en avant) ───────────────────────────────────
    const amountBoxHeight = 54;
    doc.roundedRect(marginX, y, contentWidth, amountBoxHeight, 6).fill(COLOR_NIGHT);
    doc
      .fillColor(COLOR_SLATE_LIGHT)
      .fontSize(7.5)
      .font('Helvetica')
      .text('MONTANT REÇU', marginX + 16, y + 12, { characterSpacing: 0.5 });
    doc
      .fillColor(COLOR_WHITE)
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(`${formatMontant(Number(paiement.montant))} ${paiement.currency}`, marginX + 16, y + 24);

    const paiementStatusLabel = formatFactureStatus(facture.status);
    doc
      .fillColor(facture.status === 'PAYE' ? COLOR_GREEN : COLOR_CARGO)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(paiementStatusLabel, marginX, y + 20, { width: contentWidth - 16, align: 'right' });
    doc
      .fillColor(COLOR_SLATE_LIGHT)
      .fontSize(7.5)
      .font('Helvetica')
      .text(formatMethod(paiement.method), marginX, y + 34, { width: contentWidth - 16, align: 'right' });

    y += amountBoxHeight + 14;

    // ─── Détails complémentaires ─────────────────────────────────────────────
    doc.fillColor(COLOR_SLATE).fontSize(8).font('Helvetica');
    doc.text(`Facture : ${facture.factureNumber}`, marginX, y);
    doc.text(
      `Total facture : ${formatMontant(Number(facture.montantTotal))} ${facture.currency}`,
      marginX,
      y,
      { width: contentWidth, align: 'right' },
    );
    y += 13;
    if (paiement.currency !== 'GNF') {
      doc.text(`Taux appliqué (vers GNF) : ${formatMontant(Number(paiement.tauxVersGnf))}`, marginX, y);
      y += 13;
    }

    // ─── Pied de page — contact agent + entreprise ──────────────────────────
    const footerY = doc.page.height - 96;
    doc.moveTo(marginX, footerY).lineTo(marginX + contentWidth, footerY).strokeColor(COLOR_BORDER).lineWidth(0.75).stroke();

    doc
      .fillColor(COLOR_SLATE)
      .fontSize(7)
      .font('Helvetica-Bold')
      .text('ENCAISSÉ PAR', marginX, footerY + 12, { characterSpacing: 0.5 });
    doc
      .fillColor(COLOR_NIGHT)
      .fontSize(9.5)
      .font('Helvetica-Bold')
      .text(agent?.fullName ?? 'Agent DSL Air Cargo', marginX, footerY + 22);
    if (agent?.phoneNumber) {
      doc.fillColor(COLOR_SLATE).fontSize(8).font('Helvetica').text(`Tél/WhatsApp : ${agent.phoneNumber}`, marginX, footerY + 36);
    }

    doc
      .fillColor(COLOR_SLATE)
      .fontSize(7)
      .font('Helvetica-Bold')
      .text('NOUS CONTACTER', marginX, footerY + 12, { width: contentWidth, align: 'right', characterSpacing: 0.5 });
    doc
      .fillColor(COLOR_SLATE)
      .fontSize(8)
      .font('Helvetica')
      .text(`WhatsApp : ${COMPANY.whatsapp}`, marginX, footerY + 22, { width: contentWidth, align: 'right' });
    doc.text(COMPANY.website, marginX, footerY + 36, { width: contentWidth, align: 'right' });

    doc
      .fillColor(COLOR_SLATE_LIGHT)
      .fontSize(7)
      .font('Helvetica-Oblique')
      .text('Merci de votre confiance — ce reçu fait foi de paiement.', marginX, doc.page.height - 34, {
        width: contentWidth,
        align: 'center',
      });

    doc.end();
  });
}

function formatMethod(method: string) {
  switch (method) {
    case 'ESPECES':
      return 'Payé en espèces';
    case 'ORANGE_MONEY':
      return 'Payé via Orange Money';
    case 'MTN_MOMO':
      return 'Payé via MTN Mobile Money';
    case 'VIREMENT':
      return 'Payé par virement bancaire';
    case 'AUTRE':
      return 'Autre mode de paiement';
    default:
      return method;
  }
}

function formatFactureStatus(status: string) {
  switch (status) {
    case 'PAYE':
      return 'Facture soldée';
    case 'PARTIEL':
      return 'Paiement partiel';
    case 'IMPAYE':
      return 'Reste à payer';
    default:
      return status;
  }
}
