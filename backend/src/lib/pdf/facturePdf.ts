import PDFDocument from 'pdfkit';
import { join } from 'node:path';
import { Facture, Client, Colis, Paiement, PricingRule, Lot } from '@prisma/client';

// Libellé lisible d'un mode de paiement (jamais le code interne de l'énumération)
function formatMethod(method: string): string {
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

function formatMontant(value: number): string {
  return value.toLocaleString('fr-FR').replace(/ /g, ' ');
}

export type FactureCompletePourPdf = Facture & {
  client: Client;
  colis: (Colis & { pricingRule?: PricingRule | null; lot?: Lot | null })[];
  paiements: Paiement[];
};

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
const COLOR_RED = '#dc2626';
const COLOR_AMBER = '#d97706';

const COMPANY = {
  name: 'DSL Air Cargo',
  tagline: 'Fret aérien Chine - Guinée (Guangzhou - Conakry)',
  addressConakry: 'Madina, Gare voitures Liberia, en face du Centre Ariboyah, Centre Sidy, 2ème étage, Boutique C6, Conakry',
  addressChine: '705, Bloc C, Hengsten Bldg, 207 Huanshi Middle Rd, Yuexiu, Guangzhou',
  whatsapp: '+224 628 67 48 95',
  email: 'contact@dslcargo.com',
  website: 'www.dslcargo.com',
};

export function generateFacturePdf(facture: FactureCompletePourPdf): Promise<Buffer> {
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
    const headerHeight = 100;
    doc.rect(0, 0, pageWidth, headerHeight).fill(COLOR_NIGHT);

    try {
      doc.image(LOGO_PATH, marginX, 22, { width: 56, height: 56 });
    } catch {
      // Logo absent, dégradation gracieuse
    }

    doc
      .fillColor(COLOR_WHITE)
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(COMPANY.name, marginX + 68, 26);

    doc
      .fillColor(COLOR_SKY)
      .fontSize(9.5)
      .font('Helvetica')
      .text(COMPANY.tagline.toUpperCase(), marginX + 68, 52, { characterSpacing: 0.6 });

    doc
      .fillColor(COLOR_SLATE_LIGHT)
      .fontSize(7.5)
      .font('Helvetica')
      .text(`Guinée : ${COMPANY.addressConakry}`, marginX + 68, 66, { width: 300 });
    // L'adresse de Conakry passe sur deux lignes : on place celle de Chine juste en dessous
    // (une position fixe la faisait chevaucher).
    const guineeHeight = doc.heightOfString(`Guinée : ${COMPANY.addressConakry}`, { width: 300 });
    doc.text(`Chine : ${COMPANY.addressChine}`, marginX + 68, 66 + guineeHeight + 2, { width: 300 });

    doc
      .fillColor(COLOR_WHITE)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text(`WhatsApp : ${COMPANY.whatsapp}`, pageWidth - marginX - 140, 68, { width: 140, align: 'right' })
      .text(COMPANY.website, pageWidth - marginX - 140, 80, { width: 140, align: 'right' });

    let y = headerHeight + 20;

    // ─── Titre Facture & Date ───────────────────────────────────────────────
    doc
      .fillColor(COLOR_NIGHT)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(`FACTURE N° ${facture.factureNumber}`, marginX, y);

    const dateCreationStr = new Date(facture.createdAt).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    doc
      .fillColor(COLOR_SLATE)
      .fontSize(9)
      .font('Helvetica')
      .text(`Date d'émission : ${dateCreationStr}`, marginX, y + 20);

    // Badge statut de paiement
    const badgeWidth = 140;
    const badgeHeight = 26;
    const badgeX = pageWidth - marginX - badgeWidth;
    let badgeColor = COLOR_RED;
    let badgeLabel = 'IMPAYÉE';

    if (facture.status === 'PAYE') {
      badgeColor = COLOR_GREEN;
      badgeLabel = 'PAYÉE INTÉGRALEMENT';
    } else if (facture.status === 'PARTIEL') {
      badgeColor = COLOR_AMBER;
      badgeLabel = 'PAIEMENT PARTIEL';
    }

    doc.roundedRect(badgeX, y, badgeWidth, badgeHeight, 4).fill(badgeColor);
    doc
      .fillColor(COLOR_WHITE)
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text(badgeLabel, badgeX, y + 8, { width: badgeWidth, align: 'center' });

    if (facture.livraisonDebloqueeManuel) {
      doc
        .fillColor(COLOR_CARGO)
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text('Déblocage manuel Admin autorisé', badgeX - 40, y + 29, { width: badgeWidth + 40, align: 'right' });
    }

    y += 50;

    // ─── Cadre Informations Client ──────────────────────────────────────────
    const clientBoxHeight = 65;
    doc.roundedRect(marginX, y, contentWidth, clientBoxHeight, 6).fillAndStroke(COLOR_BG_SOFT, COLOR_BORDER);

    doc
      .fillColor(COLOR_SLATE)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('FACTURÉ À (DESTINATAIRE) :', marginX + 14, y + 10);

    doc
      .fillColor(COLOR_NIGHT)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(`${facture.client.fullName}  (${facture.client.clientCode})`, marginX + 14, y + 22);

    const contactParts = [
      facture.client.phoneGn ? `Tél Guinée : ${facture.client.phoneGn}` : null,
      facture.client.phoneWhatsapp ? `WhatsApp : ${facture.client.phoneWhatsapp}` : null,
      facture.client.phoneCn ? `Chine : ${facture.client.phoneCn}` : null,
    ].filter(Boolean);

    doc
      .fillColor(COLOR_SLATE)
      .fontSize(8.5)
      .font('Helvetica')
      .text(contactParts.join('  •  ') || 'Aucun numéro renseigné', marginX + 14, y + 37);

    if (facture.client.address) {
      doc
        .fillColor(COLOR_SLATE)
        .fontSize(8)
        .font('Helvetica')
        .text(`Adresse : ${facture.client.address}`, marginX + 14, y + 49, { width: contentWidth - 28 });
    }

    y += clientBoxHeight + 20;

    // ─── Tableau des Colis ──────────────────────────────────────────────────
    doc
      .fillColor(COLOR_NIGHT)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('DÉTAIL DES COLIS EXPÉDIÉS', marginX, y);

    y += 16;

    // Colonnes du tableau
    const colX = {
      tracking: marginX,
      desc: marginX + 95,
      poidsReel: marginX + 250,
      poidsVol: marginX + 315,
      pu: marginX + 380,
      total: marginX + 440,
    };
    const colW = {
      tracking: 90,
      desc: 150,
      poidsReel: 60,
      poidsVol: 60,
      pu: 55,
      total: contentWidth - 440,
    };

    // Entête du tableau
    const tableHeaderHeight = 22;
    doc.rect(marginX, y, contentWidth, tableHeaderHeight).fill(COLOR_NIGHT);

    doc.fillColor(COLOR_WHITE).fontSize(8).font('Helvetica-Bold');
    doc.text('N° SUIVI / LTA', colX.tracking + 6, y + 7, { width: colW.tracking });
    doc.text('DESCRIPTION', colX.desc, y + 7, { width: colW.desc });
    doc.text('POIDS RÉEL', colX.poidsReel, y + 7, { width: colW.poidsReel, align: 'right' });
    doc.text('POIDS VOL.', colX.poidsVol, y + 7, { width: colW.poidsVol, align: 'right' });
    doc.text('P.U. / KG', colX.pu, y + 7, { width: colW.pu, align: 'right' });
    doc.text('MONTANT', colX.total - 6, y + 7, { width: colW.total, align: 'right' });

    y += tableHeaderHeight;

    let totalPoidsReel = 0;
    let totalPoidsTaxable = 0;

    facture.colis.forEach((c, idx) => {
      const rowBg = idx % 2 === 0 ? COLOR_WHITE : COLOR_BG_SOFT;
      const rowHeight = 24;
      doc.rect(marginX, y, contentWidth, rowHeight).fillAndStroke(rowBg, COLOR_BORDER);

      const poidsR = Number(c.poidsReelKg);
      const poidsV = Number(c.poidsVolumetriqueKg);
      totalPoidsReel += poidsR;
      totalPoidsTaxable += Number(c.poidsTaxableKg);

      const pu = Math.round(Number(c.montantEstime) / (poidsR || 1));

      doc.fillColor(COLOR_NIGHT).fontSize(8).font('Helvetica-Bold');
      doc.text(c.trackingId, colX.tracking + 6, y + 7, { width: colW.tracking });

      doc.fillColor(COLOR_SLATE).font('Helvetica');
      doc.text(c.description, colX.desc, y + 7, { width: colW.desc, ellipsis: true });

      doc.fillColor(COLOR_NIGHT);
      doc.text(`${poidsR.toFixed(2)} kg`, colX.poidsReel, y + 7, { width: colW.poidsReel, align: 'right' });
      doc.fillColor(COLOR_SLATE);
      doc.text(`${poidsV.toFixed(2)} kg`, colX.poidsVol, y + 7, { width: colW.poidsVol, align: 'right' });

      doc.text(`${formatMontant(pu)} GNF`, colX.pu, y + 7, { width: colW.pu, align: 'right' });

      doc.fillColor(COLOR_NIGHT).font('Helvetica-Bold');
      doc.text(`${formatMontant(Number(c.montantEstime))} GNF`, colX.total - 6, y + 7, {
        width: colW.total,
        align: 'right',
      });

      y += rowHeight;
    });

    // Ligne des totaux du tableau
    const totalRowHeight = 26;
    doc.rect(marginX, y, contentWidth, totalRowHeight).fillAndStroke(COLOR_BG_SOFT, COLOR_BORDER);

    doc
      .fillColor(COLOR_NIGHT)
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text('TOTAL POIDS & FACTURATION (FACTURÉ AU POIDS RÉEL) :', marginX + 8, y + 8);

    doc.text(`${totalPoidsReel.toFixed(2)} kg`, colX.poidsReel, y + 8, {
      width: colW.poidsReel,
      align: 'right',
    });

    const montantTotalNum = Number(facture.montantTotal);
    doc.fillColor(COLOR_CARGO).fontSize(10);
    doc.text(`${formatMontant(montantTotalNum)} ${facture.currency}`, colX.total - 6, y + 7, {
      width: colW.total,
      align: 'right',
    });

    y += totalRowHeight + 20;

    // ─── Règlements & Synthèse Financière ────────────────────────────────────
    const boxWidth = (contentWidth - 14) / 2;
    const boxHeight = 110;

    // Cadre Gauche : Historique des encaissements
    doc.roundedRect(marginX, y, boxWidth, boxHeight, 6).fillAndStroke(COLOR_WHITE, COLOR_BORDER);
    doc
      .fillColor(COLOR_SLATE)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('RÈGLEMENTS REÇUS :', marginX + 12, y + 10);

    let payY = y + 26;
    if (facture.paiements.length === 0) {
      doc
        .fillColor(COLOR_SLATE_LIGHT)
        .fontSize(8)
        .font('Helvetica-Oblique')
        .text('Aucun paiement enregistré pour cette facture.', marginX + 12, payY);
    } else {
      facture.paiements.forEach((p) => {
        const dateP = new Date(p.createdAt).toLocaleDateString('fr-FR');
        const pGnf = Math.round(Number(p.montant) * Number(p.tauxVersGnf));
        doc
          .fillColor(COLOR_NIGHT)
          .fontSize(7.5)
          .font('Helvetica')
          .text(`• ${dateP}  ${formatMethod(p.method)}`, marginX + 12, payY, { width: 120 })
          .text(`${formatMontant(pGnf)} GNF`, marginX + boxWidth - 95, payY, { width: 85, align: 'right' });
        payY += 14;
      });
    }

    // Cadre Droit : Synthèse Dû / Réglé / Reste
    const totalPayeGnf = facture.paiements.reduce(
      (sum, p) => sum + Number(p.montant) * Number(p.tauxVersGnf),
      0,
    );
    const resteAPayerGnf = Math.max(0, montantTotalNum - totalPayeGnf);

    const rightBoxX = marginX + boxWidth + 14;
    doc.roundedRect(rightBoxX, y, boxWidth, boxHeight, 6).fillAndStroke(COLOR_BG_SOFT, COLOR_BORDER);

    doc
      .fillColor(COLOR_SLATE)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('SYNTHÈSE DU COMPTE :', rightBoxX + 12, y + 10);

    doc
      .fillColor(COLOR_NIGHT)
      .fontSize(8.5)
      .font('Helvetica')
      .text('Montant total facturé :', rightBoxX + 12, y + 28)
      .font('Helvetica-Bold')
      .text(`${formatMontant(montantTotalNum)} GNF`, rightBoxX + boxWidth - 120, y + 28, {
        width: 108,
        align: 'right',
      });

    doc
      .fillColor(COLOR_GREEN)
      .font('Helvetica')
      .text('Total payé :', rightBoxX + 12, y + 46)
      .font('Helvetica-Bold')
      .text(`${formatMontant(totalPayeGnf)} GNF`, rightBoxX + boxWidth - 120, y + 46, {
        width: 108,
        align: 'right',
      });

    doc.rect(rightBoxX + 12, y + 64, boxWidth - 24, 0.5).fill(COLOR_BORDER);

    const resteColor = resteAPayerGnf > 0 ? COLOR_RED : COLOR_GREEN;
    doc
      .fillColor(resteColor)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Solde restant dû :', rightBoxX + 12, y + 76)
      .text(`${formatMontant(resteAPayerGnf)} GNF`, rightBoxX + boxWidth - 140, y + 76, {
        width: 128,
        align: 'right',
      });

    // ─── Pied de page & Conditions ──────────────────────────────────────────
    const footerY = doc.page.height - 75;
    doc.rect(marginX, footerY, contentWidth, 0.5).fill(COLOR_BORDER);

    doc
      .fillColor(COLOR_SLATE)
      .fontSize(7)
      .font('Helvetica-Bold')
      .text('CONDITIONS DE LIVRAISON & RÈGLEMENTS :', marginX, footerY + 8);

    doc
      .fillColor(COLOR_SLATE_LIGHT)
      .fontSize(6.5)
      .font('Helvetica')
      .text(
        "Règlements acceptés en espèces à l'entrepôt de Madina, par Orange Money (+224 628 67 48 95) ou par virement bancaire.\n" +
          "Conformément à la politique de DSL Air Cargo, les colis ne sont délivrés qu'après acquittement intégral du montant dû.\n" +
          'DSL Air Cargo — SARL au capital de 50 000 000 GNF — Centre Sidy, Madina, Conakry, République de Guinée.',
        marginX,
        footerY + 20,
        { width: contentWidth, lineGap: 2 },
      );

    doc.end();
  });
}
