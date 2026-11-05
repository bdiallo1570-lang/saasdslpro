import { join } from 'node:path';
import QRCode from 'qrcode';

// Identité commune des documents remis aux clients (facture, reçu) : mêmes couleurs que le site
// (encre + ambre, voir tailwind.config.js), mêmes coordonnées, mêmes formats de nombres.

type Doc = PDFKit.PDFDocument;

export const COLORS = {
  ink: '#0B0D12',
  inkSoft: '#1E2330',
  ember: '#F59E0B',
  emberDark: '#B45309',
  text: '#111827',
  muted: '#6B7280',
  faint: '#9CA3AF',
  border: '#E5E7EB',
  soft: '#F8F7F4',
  white: '#FFFFFF',
  green: '#047857',
  greenSoft: '#ECFDF5',
  red: '#B91C1C',
  redSoft: '#FEF2F2',
  amberSoft: '#FFFBEB',
};

export const COMPANY = {
  name: 'DSL Air Cargo',
  // « → » n'existe pas dans l'encodage des polices standard des PDF : « - » à la place
  tagline: 'Fret aérien et maritime · Chine - Guinée',
  addressGuinee: 'Madina, Gare voitures Liberia, en face du Centre Ariboyah, Centre Sidy, 2e étage, Boutique C6, Conakry',
  // Version courte pour les petits formats (pied de page du reçu A5)
  addressCourte: 'Centre Sidy, Boutique C6, Madina, Conakry',
  whatsapp: '+224 628 67 48 95',
  website: 'www.dslcargo.com',
};

const LOGO_PATH = join(__dirname, '..', '..', 'assets', 'dsl-logo.png');

// toLocaleString('fr-FR') sépare les milliers par U+202F, absent des polices standard des PDF
// (il s'afficherait « / ») : remplacé par une espace normale.
export function formatMontant(value: number): string {
  return Math.round(value).toLocaleString('fr-FR').replace(/[  ]/g, ' ');
}

export function formatKg(value: number): string {
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[  ]/g, ' ')} kg`;
}

export function formatDate(date: Date, withTime = false): string {
  const d = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Africa/Conakry' });
  if (!withTime) return d;
  const t = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Conakry' });
  return `${d} à ${t}`;
}

export function formatMethod(method: string): string {
  switch (method) {
    case 'ESPECES':
      return 'Espèces';
    case 'ORANGE_MONEY':
      return 'Orange Money';
    case 'MTN_MOMO':
      return 'MTN MoMo';
    case 'VIREMENT':
      return 'Virement';
    default:
      return 'Autre';
  }
}

// Bandeau d'en-tête : logo rond, nom, accroche ; à droite le type et le numéro du document
export function drawHeader(
  doc: Doc,
  opts: { marginX: number; height: number; kind: string; number: string; date: string },
) {
  const { marginX, height } = opts;
  const width = doc.page.width;
  doc.rect(0, 0, width, height).fill(COLORS.ink);
  doc.rect(0, height, width, 2.5).fill(COLORS.ember);

  const r = Math.min(26, height / 2 - 14);
  const cx = marginX + r;
  const cy = height / 2;
  doc.circle(cx, cy, r).fill(COLORS.white);
  doc.save();
  try {
    doc.circle(cx, cy, r - 2).clip();
    doc.image(LOGO_PATH, cx - (r - 2), cy - (r - 2), { width: (r - 2) * 2, height: (r - 2) * 2 });
  } catch {
    // Logo absent : le disque blanc reste, le document reste valable
  }
  doc.restore();

  const large = height > 90;
  const textX = marginX + r * 2 + 14;
  doc
    .fillColor(COLORS.white)
    .font('Helvetica-Bold')
    .fontSize(large ? 19 : 16)
    .text(COMPANY.name, textX, cy - 17, { lineBreak: false });
  doc
    .fillColor(COLORS.ember)
    .font('Helvetica-Bold')
    .fontSize(large ? 7.5 : 6.3)
    .text(COMPANY.tagline.toUpperCase(), textX, cy + 6, { characterSpacing: large ? 0.8 : 0.4, lineBreak: false });

  // Petit format : bloc de droite plus étroit pour ne pas toucher l'accroche
  const rightW = large ? 190 : 140;
  const rightX = width - marginX - rightW;
  doc.fillColor(COLORS.ember).font('Helvetica-Bold').fontSize(8).text(opts.kind.toUpperCase(), rightX, cy - 22, {
    width: rightW,
    align: 'right',
    characterSpacing: 2,
  });
  doc
    .fillColor(COLORS.white)
    .font('Helvetica-Bold')
    .fontSize(height > 90 ? 15 : 13)
    .text(opts.number, rightX, cy - 9, { width: rightW, align: 'right' });
  doc.fillColor(COLORS.faint).font('Helvetica').fontSize(8).text(opts.date, rightX, cy + 9, { width: rightW, align: 'right' });
}

// Pastille arrondie (statut) ; renvoie sa largeur
export function drawPill(
  doc: Doc,
  x: number,
  y: number,
  label: string,
  color: string,
  background: string,
  alignRight = false,
) {
  doc.font('Helvetica-Bold').fontSize(7.5);
  const w = doc.widthOfString(label, { characterSpacing: 0.6 }) + 18;
  const px = alignRight ? x - w : x;
  doc.roundedRect(px, y, w, 18, 9).fill(background);
  doc.fillColor(color).text(label, px, y + 5.5, { width: w, align: 'center', characterSpacing: 0.6 });
  return w;
}

// QR code vectoriel (net à toute taille d'impression), dessiné module par module
export function drawQr(doc: Doc, text: string, x: number, y: number, size: number) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const count = qr.modules.size;
  const cell = size / count;
  doc.rect(x - 4, y - 4, size + 8, size + 8).fill(COLORS.white);
  doc.fillColor(COLORS.ink);
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.modules.get(row, col)) doc.rect(x + col * cell, y + row * cell, cell + 0.15, cell + 0.15).fill();
    }
  }
}

// Pied de page de chaque page (document créé avec bufferPages) : mentions + pagination
export function drawFooters(doc: Doc, marginX: number, lines: string[]) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const width = doc.page.width;
    const y = doc.page.height - 30 - lines.length * 9;
    doc.rect(marginX, y - 8, width - marginX * 2, 0.6).fill(COLORS.border);
    doc.fillColor(COLORS.faint).font('Helvetica').fontSize(6.8);
    lines.forEach((line, k) => {
      // Une ligne par mention, jamais de retour à la ligne (sinon chevauchement) : coupée si trop longue
      doc.text(line, marginX, y + k * 9, { width: width - marginX * 2 - 60, height: 9, ellipsis: true });
    });
    doc.text(`Page ${i - range.start + 1} / ${range.count}`, width - marginX - 60, y + (lines.length - 1) * 9, {
      width: 60,
      align: 'right',
      lineBreak: false,
    });
  }
}
