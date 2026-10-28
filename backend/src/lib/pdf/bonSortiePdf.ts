import PDFDocument from 'pdfkit';
import { join } from 'node:path';
import { Colis, Client, Facture, Lot, User } from '@prisma/client';

function formatMontant(value: number): string {
  return value.toLocaleString('fr-FR').replace(/ /g, ' ');
}

export interface BonSortieData {
  colis: Colis & { lot?: Lot | null };
  client: Client;
  facture: Facture | null;
  agentLivreur: User | null;
  nomMandataire?: string;
  pieceIdentite?: string;
}

const LOGO_PATH = join(__dirname, '..', '..', 'assets', 'dsl-logo.png');

const COLOR_NIGHT = '#0f172a';
const COLOR_SKY = '#0ea5e9';
const COLOR_CARGO = '#f97316';
const COLOR_SLATE = '#64748b';
const COLOR_SLATE_LIGHT = '#94a3b8';
const COLOR_BORDER = '#e2e8f0';
const COLOR_BG_SOFT = '#f8fafc';
const COLOR_WHITE = '#ffffff';
const COLOR_GREEN = '#059669';

const COMPANY = {
  name: 'DSL Air Cargo',
  tagline: 'Fret aérien Chine - Guinée (Guangzhou - Conakry)',
  addressConakry: 'Madina, Gare voitures Liberia, en face du Centre Ariboyah, Centre Sidy, 2ème étage, Boutique C6, Conakry',
  whatsapp: '+224 628 67 48 95',
  website: 'www.dslcargo.com',
};

export function generateBonSortiePdf({
  colis,
  client,
  facture,
  agentLivreur,
  nomMandataire,
  pieceIdentite,
}: BonSortieData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const marginX = 40;
    const contentWidth = pageWidth - marginX * 2;

    // ─── En-tête officiel ───────────────────────────────────────────────────
    const headerHeight = 90;
    doc.rect(0, 0, pageWidth, headerHeight).fill(COLOR_NIGHT);

    try {
      doc.image(LOGO_PATH, marginX, 18, { width: 54, height: 54 });
    } catch {
      // Logo absent, dégradation gracieuse
    }

    doc
      .fillColor(COLOR_WHITE)
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(COMPANY.name, marginX + 66, 22);

    doc
      .fillColor(COLOR_SKY)
      .fontSize(9)
      .font('Helvetica')
      .text(COMPANY.tagline.toUpperCase(), marginX + 66, 46, { characterSpacing: 0.6 });

    doc
      .fillColor(COLOR_SLATE_LIGHT)
      .fontSize(7.5)
      .font('Helvetica')
      .text(`Entrepôt Conakry : ${COMPANY.addressConakry}`, marginX + 66, 62, { width: 320 });

    doc
      .fillColor(COLOR_WHITE)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text(`WhatsApp : ${COMPANY.whatsapp}`, pageWidth - marginX - 140, 62, { width: 140, align: 'right' });

    let y = headerHeight + 18;

    // ─── Titre du document ──────────────────────────────────────────────────
    doc
      .fillColor(COLOR_CARGO)
      .fontSize(15)
      .font('Helvetica-Bold')
      .text("BON DE SORTIE D'ENTREPÔT & LIVRAISON", marginX, y, {
        width: contentWidth,
        align: 'center',
        characterSpacing: 0.8,
      });

    y += 24;

    const dateLivraison = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    doc
      .fillColor(COLOR_SLATE)
      .fontSize(8.5)
      .font('Helvetica')
      .text(`Délivré le ${dateLivraison} à l'entrepôt de Madina (Conakry)`, marginX, y, {
        width: contentWidth,
        align: 'center',
      });

    y += 22;

    // ─── 2 Cartouches : Destinataire & Références Transport ─────────────────
    const boxW = (contentWidth - 12) / 2;
    const infoBoxH = 75;

    // Cartouche Gauche : Destinataire
    doc.roundedRect(marginX, y, boxW, infoBoxH, 6).fillAndStroke(COLOR_BG_SOFT, COLOR_BORDER);
    doc
      .fillColor(COLOR_SLATE)
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text('CLIENT DESTINATAIRE :', marginX + 12, y + 10);

    doc
      .fillColor(COLOR_NIGHT)
      .fontSize(10.5)
      .font('Helvetica-Bold')
      .text(`${client.fullName}  (${client.clientCode})`, marginX + 12, y + 22);

    const contactStr = [...new Set([client.phoneGn, client.phoneWhatsapp].filter(Boolean))].join(' / ') || 'Non renseigné';
    doc
      .fillColor(COLOR_SLATE)
      .fontSize(8)
      .font('Helvetica')
      .text(`Contact : ${contactStr}`, marginX + 12, y + 37)
      .text(`Adresse : ${client.address || 'Conakry, Guinée'}`, marginX + 12, y + 50, { width: boxW - 24, ellipsis: true });

    // Cartouche Droit : Référence expédition & Vol
    const rightBoxX = marginX + boxW + 12;
    doc.roundedRect(rightBoxX, y, boxW, infoBoxH, 6).fillAndStroke(COLOR_BG_SOFT, COLOR_BORDER);
    doc
      .fillColor(COLOR_SLATE)
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text('RÉFÉRENCE CORRIDOR & ARRIVÉE :', rightBoxX + 12, y + 10);

    doc
      .fillColor(COLOR_NIGHT)
      .fontSize(10.5)
      .font('Helvetica-Bold')
      .text(`Lot : ${colis.lot?.lotNumber || 'Non assigné'}`, rightBoxX + 12, y + 22);

    doc
      .fillColor(COLOR_SLATE)
      .fontSize(8)
      .font('Helvetica')
      .text(`Vol : ${colis.lot?.flightNumber || 'N/A'}`, rightBoxX + 12, y + 37)
      .text(`Corridor : Guangzhou (Chine) - Conakry (Guinée)`, rightBoxX + 12, y + 50);

    y += infoBoxH + 18;

    // ─── Détail des marchandises délivrées ──────────────────────────────────
    doc
      .fillColor(COLOR_NIGHT)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('COLIS DÉLIVRÉ(S) CONFORME(S)', marginX, y);

    y += 16;

    const tableH = 22;
    doc.rect(marginX, y, contentWidth, tableH).fill(COLOR_NIGHT);

    doc.fillColor(COLOR_WHITE).fontSize(8).font('Helvetica-Bold');
    doc.text('N° SUIVI / LTA', marginX + 10, y + 7, { width: 110 });
    doc.text('DESCRIPTION DU COLIS', marginX + 125, y + 7, { width: 230 });
    doc.text('POIDS CONSTATÉ', marginX + 360, y + 7, { width: 75, align: 'right' });
    doc.text('STATUT', marginX + 445, y + 7, { width: contentWidth - 445, align: 'center' });

    y += tableH;

    const rowH = 32;
    doc.rect(marginX, y, contentWidth, rowH).fillAndStroke(COLOR_WHITE, COLOR_BORDER);

    doc.fillColor(COLOR_NIGHT).fontSize(9).font('Helvetica-Bold');
    doc.text(colis.trackingId, marginX + 10, y + 10, { width: 110 });

    doc.fillColor(COLOR_SLATE).font('Helvetica').fontSize(8.5);
    doc.text(colis.description, marginX + 125, y + 10, { width: 230, ellipsis: true });

    doc.fillColor(COLOR_NIGHT).font('Helvetica-Bold').fontSize(9);
    doc.text(`${Number(colis.poidsReelKg).toFixed(2)} kg`, marginX + 360, y + 10, { width: 75, align: 'right' });

    doc.fillColor(COLOR_GREEN).fontSize(8.5);
    doc.text('LIVRÉ', marginX + 445, y + 10, { width: contentWidth - 445, align: 'center' });

    y += rowH + 18;

    // ─── Contrôle de facturation et conformité financière ───────────────────
    const financeBoxH = 65;
    doc.roundedRect(marginX, y, contentWidth, financeBoxH, 6).fillAndStroke(COLOR_BG_SOFT, COLOR_BORDER);

    doc
      .fillColor(COLOR_SLATE)
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text('CONTRÔLE FINANCIER & AUTORISATION DE SORTIE :', marginX + 12, y + 10);

    const numFacture = facture ? facture.factureNumber : 'Facture non trouvée';
    const estSolde = facture?.status === 'PAYE';
    const estDebloqueManuel = facture?.livraisonDebloqueeManuel;

    let certifTitre = 'MARCHANDISE ACQUITTÉE ET CONFORME';
    let certifDetail = `Facture associée : ${numFacture}  —  Montant total : ${facture ? formatMontant(Number(facture.montantTotal)) : 0} GNF (Intégralement soldé).`;

    if (!estSolde && estDebloqueManuel) {
      certifTitre = 'DÉBLOCAGE ADMIN EXCEPTIONNEL AUTORISÉ';
      certifDetail = `Facture : ${numFacture}  —  Débloqué par l'Administration. Motif consigné : « ${facture?.livraisonDeblocageMotif || 'Autorisation gérance'} ».`;
    }

    doc
      .fillColor(COLOR_GREEN)
      .fontSize(9.5)
      .font('Helvetica-Bold')
      .text(certifTitre, marginX + 12, y + 24);

    doc
      .fillColor(COLOR_SLATE)
      .fontSize(8)
      .font('Helvetica')
      .text(certifDetail, marginX + 12, y + 38)
      .text("Ce document certifie la sortie régulière des marchandises de l'entrepôt sous douane de Conakry.", marginX + 12, y + 50);

    y += financeBoxH + 24;

    // ─── Double Cadre d'Émargement / Signatures ─────────────────────────────
    doc
      .fillColor(COLOR_NIGHT)
      .fontSize(10.5)
      .font('Helvetica-Bold')
      .text('ÉMARGEMENT & DÉCHARGE DE LIVRAISON', marginX, y);

    y += 16;

    const signBoxW = (contentWidth - 14) / 2;
    const signBoxH = 150;

    // Cadre Gauche : Agent Entrepôt Conakry
    doc.roundedRect(marginX, y, signBoxW, signBoxH, 6).fillAndStroke(COLOR_WHITE, COLOR_BORDER);

    doc
      .fillColor(COLOR_NIGHT)
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text("POUR DSL AIR CARGO (AGENT ENTREPÔT) :", marginX + 12, y + 12);

    const agentNom = agentLivreur?.fullName || 'Agent Entrepôt Conakry';
    doc
      .fillColor(COLOR_SLATE)
      .fontSize(8)
      .font('Helvetica')
      .text(`Agent : ${agentNom}`, marginX + 12, y + 30)
      .text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, marginX + 12, y + 44);

    doc
      .fillColor(COLOR_SLATE_LIGHT)
      .fontSize(7)
      .font('Helvetica-Oblique')
      .text('Cachet et Visa de remise :', marginX + 12, y + 68);

    doc.rect(marginX + 12, y + 84, signBoxW - 24, 52).dash(2, { space: 2 }).stroke(COLOR_BORDER);
    doc.undash();

    // Cadre Droit : Destinataire ou Mandataire
    const rightSignX = marginX + signBoxW + 14;
    doc.roundedRect(rightSignX, y, signBoxW, signBoxH, 6).fillAndStroke(COLOR_WHITE, COLOR_BORDER);

    doc
      .fillColor(COLOR_NIGHT)
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text('LE RÉCEPTIONNAIRE (DESTINATAIRE OU MANDATAIRE) :', rightSignX + 12, y + 12);

    const nomRecepteur = nomMandataire || client.fullName;
    doc
      .fillColor(COLOR_SLATE)
      .fontSize(8)
      .font('Helvetica')
      .text(`Nom : ${nomRecepteur}`, rightSignX + 12, y + 30)
      .text(`N° Pièce d'identité : ${pieceIdentite || 'Présentée et vérifiée'}`, rightSignX + 12, y + 44);

    doc
      .fillColor(COLOR_CARGO)
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text('Mention manuscrite obligatoire : « Reçu conforme et en bon état »', rightSignX + 12, y + 62, {
        width: signBoxW - 24,
      });

    doc.rect(rightSignX + 12, y + 84, signBoxW - 24, 52).dash(2, { space: 2 }).stroke(COLOR_BORDER);
    doc.undash();

    // ─── Pied de page de décharge ───────────────────────────────────────────
    const footerY = doc.page.height - 60;
    doc.rect(marginX, footerY, contentWidth, 0.5).fill(COLOR_BORDER);

    doc
      .fillColor(COLOR_SLATE_LIGHT)
      .fontSize(6.5)
      .font('Helvetica')
      .text(
        "Important : La remise du colis et l'émargement du présent bon de sortie transfèrent la garde matérielle des marchandises au destinataire et valent acceptation sans réserve. " +
          "DSL Air Cargo décline toute réclamation ultérieure relative au nombre, au poids ou à l'état des colis après sortie d'entrepôt.",
        marginX,
        footerY + 10,
        { width: contentWidth, align: 'center', lineGap: 2 },
      );

    doc.end();
  });
}
