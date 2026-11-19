import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { LegalLayout, Liste } from '../legal/LegalLayout';
import { ADRESSE, LegalSection, WHATSAPP } from '../legal/legalInfo';

// Conditions générales de vente et de transport, publiques. Elles reprennent les règles déjà
// annoncées sur le site (FAQ, produits interdits) et appliquées par la plateforme (poids réel de
// Chine, tarif du jour de l'enregistrement, remise après paiement complet, devis à 15 jours),
// plus trois règles fixées par la direction : responsabilité limitée au fret payé, stockage
// gratuit 30 jours, réclamations au retrait ou sous 48 h. Aucun prix ici : ils sont en base.

const SECTIONS: LegalSection[] = [
  {
    id: 'objet',
    titre: 'Objet et acceptation',
    contenu: (
      <p>
        Ces conditions s’appliquent à tous les services de DSL Air Cargo : fret aérien et fret maritime de la Chine vers
        la Guinée. En déposant un colis dans l’un de nos entrepôts, ou en acceptant un devis, vous acceptez ces
        conditions. Ce sont celles en vigueur le jour du dépôt de votre colis qui s’appliquent à cet envoi.
      </p>
    ),
  },
  {
    id: 'services',
    titre: 'Nos services',
    contenu: (
      <Liste
        items={[
          <>
            <strong>Réception</strong> de vos colis à Guangzhou, dans notre entrepôt aérien ou notre entrepôt maritime
            selon le mode choisi. Chaque colis est pesé, enregistré et reçoit un numéro de suivi.
          </>,
          <>
            <strong>Transport</strong> jusqu’à Conakry, par avion ou par bateau.
          </>,
          <>
            <strong>Dédouanement</strong> à l’arrivée : inclus dans le prix en aérien, facturé à part en maritime.
          </>,
          <>
            <strong>Mise à disposition</strong> à notre entrepôt de Madina, avec un message WhatsApp dès que votre colis
            est disponible.
          </>,
        ]}
      />
    ),
  },
  {
    id: 'marchandises',
    titre: 'Vos marchandises',
    contenu: (
      <>
        <p>
          Vous êtes responsable du contenu de vos colis et de l’exactitude de leur description. Certains produits sont{' '}
          <strong>interdits</strong> : matières dangereuses (explosifs, produits inflammables, corrosifs, radioactifs),
          armes et drogues, contrefaçons et faux documents, batteries au lithium seules en avion, liquides non
          identifiés, animaux vivants et denrées périssables non autorisées.
        </p>
        <p className="mt-3">
          D’autres passent <strong>sous conditions</strong> : batteries intégrées aux appareils, liquides, crèmes et
          poudres bien identifiés et fermés hermétiquement, médicaments réglementés et déclarés. En cas de doute,
          demandez-nous avant d’envoyer.
        </p>
        <Liste
          items={[
            'Nous pouvons refuser un colis interdit, mal décrit ou mal emballé.',
            'L’emballage est à votre charge : cartons solides, objets fragiles protégés et signalés.',
            'Si un contenu interdit ou non déclaré entraîne une saisie, une amende ou des frais, ils restent à votre charge.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'prix',
    titre: 'Prix et calcul',
    contenu: (
      <>
        <Liste
          items={[
            <>
              <strong>Aérien</strong> : prix au kilo selon la catégorie de marchandise (Standard ou Sensible), tout
              compris jusqu’à Madina, dédouanement inclus. Un prix négocié peut être accordé pour les gros volumes.
            </>,
            <>
              <strong>Poids facturé</strong> : le poids réel pesé à la réception en Chine. C’est lui qui fait foi ; un
              écart constaté à l’arrivée est vérifié et vous est communiqué avant tout ajustement.
            </>,
            <>
              <strong>Maritime</strong> : prix au mètre cube (m³) ; le dédouanement est facturé à part, en francs
              guinéens.
            </>,
            <>
              <strong>Tarif appliqué</strong> : celui en vigueur le jour où votre colis est enregistré à notre entrepôt.
              Les tarifs du jour sont affichés sur notre site.
            </>,
            <>
              <strong>Devis</strong> : valable jusqu’à la date indiquée dessus (15 jours par défaut). Une facture
              proforma est une proposition de prix, sans valeur de facture.
            </>,
          ]}
        />
        <p className="mt-4">Les montants sont exprimés et payables en francs guinéens (GNF).</p>
      </>
    ),
  },
  {
    id: 'delais',
    titre: 'Délais',
    contenu: (
      <p>
        Dès que votre colis est enregistré et placé sur un vol, nous vous donnons une date d’arrivée estimée. En
        maritime, comptez environ 3 mois de Guangzhou à Madina. Ces délais sont <strong>indicatifs</strong> : un retard
        dû aux compagnies de transport, à la douane, à la météo ou à un événement que nous ne maîtrisons pas ne donne
        pas lieu à indemnisation.
      </p>
    ),
  },
  {
    id: 'paiement',
    titre: 'Paiement',
    contenu: (
      <Liste
        items={[
          'Au comptoir de Madina, en espèces, par Orange Money ou par virement.',
          'En une ou plusieurs fois : chaque paiement donne lieu à un reçu, et votre solde reste consultable.',
          <>
            <strong>Un colis n’est remis qu’une fois sa facture entièrement payée.</strong>
          </>,
        ]}
      />
    ),
  },
  {
    id: 'retrait',
    titre: 'Retrait et stockage',
    contenu: (
      <Liste
        items={[
          'Votre colis est à retirer à notre entrepôt de Madina dès réception de notre message de disponibilité.',
          'Une autre personne peut le retirer pour vous : son nom et le numéro de sa pièce d’identité sont inscrits sur le bon de sortie.',
          <>
            <strong>Stockage gratuit pendant 30 jours</strong> à compter du message de disponibilité. Au-delà, des frais
            de stockage peuvent être facturés ; leur montant vous est communiqué sur demande.
          </>,
          'Un colis non retiré 6 mois après le message de disponibilité, et malgré une relance de notre part, est considéré comme abandonné : nous pouvons alors en disposer.',
        ]}
      />
    ),
  },
  {
    id: 'responsabilite',
    titre: 'Responsabilité',
    contenu: (
      <>
        <p>
          Nous sommes responsables de votre colis de sa réception à notre entrepôt de Guangzhou jusqu’à sa remise à
          Madina. S’il est perdu ou endommagé par notre faute pendant cette période,{' '}
          <strong>nous vous remboursons les frais de transport payés pour ce colis</strong>. La valeur de la marchandise
          elle-même n’est pas couverte : pour des marchandises de valeur, nous vous conseillons de les assurer.
        </p>
        <p className="mt-3">Notre responsabilité ne s’applique pas aux dommages qui viennent :</p>
        <Liste
          items={[
            'd’un emballage insuffisant ou inadapté ;',
            'de la nature même de la marchandise (fragilité, péremption, fuite d’un liquide mal fermé) ;',
            'd’un contenu interdit, non déclaré ou mal décrit, y compris sa saisie par la douane ;',
            'd’un événement que nous ne pouvons ni prévoir ni empêcher (catastrophe, guerre, décision des autorités).',
          ]}
        />
      </>
    ),
  },
  {
    id: 'reclamations',
    titre: 'Réclamations',
    contenu: (
      <>
        <p>
          Vérifiez votre colis au moment du retrait et signalez tout problème (colis abîmé, ouvert ou manquant) avant de
          partir. Si vous le découvrez après, vous avez <strong>48 heures</strong> pour nous le signaler, avec votre
          numéro de suivi et des photos.
        </p>
        <p className="mt-3">
          Passé ce délai sans réserve, le colis est considéré comme remis en bon état. Les réclamations se font sur
          WhatsApp au {WHATSAPP} ou à notre boutique : {ADRESSE}.
        </p>
      </>
    ),
  },
  {
    id: 'donnees',
    titre: 'Données personnelles',
    contenu: (
      <p>
        Les informations que vous nous confiez servent uniquement à traiter vos envois. Leur utilisation et vos droits
        sont détaillés dans notre{' '}
        <Link to="/confidentialite" className="text-ember-500 underline-offset-2 hover:underline">
          politique de confidentialité
        </Link>
        .
      </p>
    ),
  },
  {
    id: 'litiges',
    titre: 'Droit applicable et litiges',
    contenu: (
      <p>
        Ces conditions sont soumises au droit guinéen. En cas de désaccord, nous cherchons d’abord une solution amiable
        avec vous. À défaut, le litige est porté devant les juridictions compétentes de Conakry.
      </p>
    ),
  },
];

const EN_BREF = [
  'Prix au kilo sur le poids réel pesé en Chine (aérien) ou au m³ (maritime).',
  'Votre colis vous est remis à Madina une fois sa facture entièrement payée.',
  'Stockage gratuit 30 jours ; tout problème est à signaler au retrait ou sous 48 h.',
];

export default function ConditionsGeneralesPage() {
  return (
    <LegalLayout
      surtitre="Nos engagements"
      Icone={FileText}
      titre="Conditions générales"
      intro="Les règles qui s’appliquent quand vous confiez un colis à DSL Air Cargo, de la Chine jusqu’à la remise à Conakry."
      miseAJour="19 novembre 2026"
      enBref={EN_BREF}
      sections={SECTIONS}
      question="Une question sur ces conditions ?"
      autrePage={{ to: '/confidentialite', label: 'Politique de confidentialité' }}
    />
  );
}
