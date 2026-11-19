import { ShieldCheck } from 'lucide-react';
import { LegalLayout, Liste } from '../legal/LegalLayout';
import { ADRESSE, LegalSection, WHATSAPP } from '../legal/legalInfo';

// Politique de confidentialité, publique. Le contenu décrit ce que fait réellement la plateforme
// (données en base, stockage navigateur, prestataires) : à mettre à jour si l'un d'eux change.

const SECTIONS: LegalSection[] = [
  {
    id: 'responsable',
    titre: 'Qui est responsable de vos données',
    contenu: (
      <p>
        DSL Air Cargo, entreprise de fret aérien et maritime entre la Chine et la Guinée, est responsable des données
        traitées sur ce site et dans sa plateforme de gestion. Vous pouvez nous joindre sur WhatsApp au {WHATSAPP} ou à
        notre boutique : {ADRESSE}.
      </p>
    ),
  },
  {
    id: 'donnees',
    titre: 'Les données que nous collectons',
    contenu: (
      <>
        <p>Nous ne collectons que ce qui est utile pour transporter, facturer et livrer vos colis :</p>
        <Liste
          items={[
            <>
              <strong>Identité et contact</strong> : nom, numéros de téléphone (Guinée, Chine, WhatsApp), adresse, et
              votre code client.
            </>,
            <>
              <strong>Vos colis</strong> : description des marchandises, poids, dimensions, photos prises à la
              réception, dates et étapes d’acheminement.
            </>,
            <>
              <strong>Facturation</strong> : devis, factures, montants, paiements effectués (montant, date, mode de
              paiement, référence) et reçus.
            </>,
            <>
              <strong>Messages</strong> : les messages WhatsApp que la plateforme vous envoie (réception de votre colis,
              arrivée, rappels de paiement) sont conservés avec leur date.
            </>,
            <>
              <strong>Retrait</strong> : si quelqu’un retire un colis à votre place, son nom et le numéro de sa pièce
              d’identité sont inscrits sur le bon de sortie.
            </>,
            <>
              <strong>Espace client</strong>, si vous l’activez : numéro de téléphone, e-mail éventuel et mot de passe,
              enregistré uniquement sous forme chiffrée.
            </>,
            <>
              <strong>Traçabilité</strong> : chaque action de notre personnel sur un colis (enregistrement, correction,
              changement de statut, remise) est inscrite dans un journal, avec son auteur et sa date.
            </>,
            <>
              <strong>Statistiques de visite</strong> : pages consultées du site public, pays, type d’appareil et
              navigateur, mesurés de façon anonyme, sans cookie ni identifiant personnel. Les écrans de l’espace de
              gestion ne sont pas mesurés.
            </>,
          ]}
        />
        <p className="mt-4">
          Le calculateur de prix et le suivi de colis du site ne demandent ni nom ni téléphone : seuls le poids saisi ou
          le numéro de suivi sont utilisés, le temps de vous répondre.
        </p>
      </>
    ),
  },
  {
    id: 'utilisation',
    titre: 'Pourquoi nous les utilisons',
    contenu: (
      <Liste
        items={[
          'Réceptionner vos colis à notre entrepôt en Chine, les expédier, les dédouaner et vous les remettre en Guinée.',
          'Établir vos devis, factures et reçus, et enregistrer vos paiements.',
          'Vous tenir informé de l’avancement de vos envois et de ce qui reste à payer.',
          'Vérifier l’identité de la personne qui retire un colis, pour qu’il soit remis à la bonne personne.',
          'Assurer la sécurité de la plateforme et garder une trace de chaque modification.',
          'Respecter nos obligations légales, notamment comptables.',
        ]}
      />
    ),
  },
  {
    id: 'partage',
    titre: 'Qui peut y accéder',
    contenu: (
      <>
        <p>
          <strong>Nous ne vendons ni ne louons vos données.</strong> Elles ne sont accessibles qu’à :
        </p>
        <Liste
          items={[
            <>
              <strong>Notre personnel</strong>, en Chine et en Guinée, chacun selon son rôle (réception, caisse,
              administration) et uniquement pour ce dont il a besoin.
            </>,
            <>
              <strong>Nos prestataires techniques</strong>, qui agissent pour notre compte : Vercel et Render
              (hébergement du site et de la plateforme, statistiques de visite anonymes avec Vercel Analytics), Green
              API et WhatsApp (envoi des messages). Ils n’utilisent pas
              vos données pour leur propre compte.
            </>,
            <>
              <strong>Les autorités</strong>, lorsque la loi nous y oblige (par exemple la douane pour le dédouanement).
            </>,
          ]}
        />
        <p className="mt-4">
          Vos factures, reçus et devis peuvent vous être envoyés sous forme d’un lien personnel, protégé par une
          signature et valable 180 jours. Toute personne qui possède ce lien peut ouvrir le document : ne le transférez
          qu’aux personnes de confiance.
        </p>
      </>
    ),
  },
  {
    id: 'transferts',
    titre: 'Données hors de Guinée',
    contenu: (
      <p>
        Notre activité relie la Chine et la Guinée : vos données sont donc consultées par notre équipe de Guangzhou pour
        réceptionner vos colis. Les serveurs de nos hébergeurs peuvent aussi se trouver hors de Guinée. Dans tous les
        cas, l’accès reste limité aux personnes et prestataires décrits ci-dessus.
      </p>
    ),
  },
  {
    id: 'conservation',
    titre: 'Combien de temps nous les gardons',
    contenu: (
      <Liste
        items={[
          <>
            <strong>Factures, reçus et paiements</strong> : 10 ans, durée de conservation des pièces comptables prévue
            par le droit OHADA.
          </>,
          <>
            <strong>Fiche client, colis, devis et messages</strong> : 3 ans après votre dernier envoi, puis ils sont
            supprimés ou rendus anonymes.
          </>,
          <>
            <strong>Espace client</strong> : tant que votre compte est actif ; vous pouvez demander sa fermeture à tout
            moment.
          </>,
          <>
            <strong>Journal des actions</strong> : aussi longtemps que les données qu’il concerne.
          </>,
        ]}
      />
    ),
  },
  {
    id: 'securite',
    titre: 'Comment nous les protégeons',
    contenu: (
      <Liste
        items={[
          'Échanges chiffrés entre votre appareil et nos serveurs (HTTPS).',
          'Mots de passe enregistrés uniquement sous forme chiffrée : personne, même chez nous, ne peut les lire.',
          'Accès du personnel limité selon son rôle ; chaque action est inscrite dans un journal que le personnel ne peut ni modifier ni effacer.',
          'Liens de documents signés et limités dans le temps.',
        ]}
      />
    ),
  },
  {
    id: 'navigateur',
    titre: 'Cookies et stockage sur votre appareil',
    contenu: (
      <p>
        Ce site n’utilise <strong>aucun cookie publicitaire ni de suivi</strong>. La fréquentation est mesurée avec
        Vercel Analytics, de façon anonyme : sans cookie, sans identifiant personnel et sans rien enregistrer sur votre
        appareil. Lorsque vous
        vous connectez à votre espace, votre navigateur garde seulement de quoi rester connecté (effacé à la
        déconnexion), votre préférence d’affichage (mode clair ou sombre) et le fait que vous avez fermé le bandeau
        d’information sur les cookies. Ces informations restent sur votre appareil.
      </p>
    ),
  },
  {
    id: 'droits',
    titre: 'Vos droits',
    contenu: (
      <>
        <p>Vous pouvez à tout moment :</p>
        <Liste
          items={[
            'savoir quelles données nous avons sur vous et en obtenir une copie ;',
            'faire corriger une information inexacte ou incomplète ;',
            'demander la suppression de vos données, sauf celles que la loi nous oblige à garder (pièces comptables) ;',
            'vous opposer à recevoir des messages qui ne concernent pas directement un de vos envois.',
          ]}
        />
        <p className="mt-4">
          Écrivez-nous sur WhatsApp au {WHATSAPP} ou passez à notre boutique. Nous pourrons vous demander de confirmer
          votre identité (par exemple depuis le numéro enregistré à votre nom) avant de répondre, et nous vous
          répondrons dans un délai de 30 jours.
        </p>
      </>
    ),
  },
  {
    id: 'loi',
    titre: 'Cadre légal et mises à jour',
    contenu: (
      <p>
        Cette politique s’inscrit dans le cadre de la loi guinéenne L/2016/037/AN du 28 juillet 2016 relative à la
        cybersécurité et à la protection des données à caractère personnel. Nous pouvons la faire évoluer, par exemple
        si nous ajoutons un service ; la date de dernière mise à jour figure en haut de cette page.
      </p>
    ),
  },
];

const EN_BREF = [
  'Vos données servent uniquement à transporter, facturer et livrer vos colis.',
  'Nous ne les vendons pas et n’utilisons aucun cookie publicitaire.',
  'Vous pouvez les consulter, les corriger ou demander leur suppression sur WhatsApp.',
];

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalLayout
      surtitre="Vos données"
      Icone={ShieldCheck}
      titre="Politique de confidentialité"
      description="Comment DSL Air Cargo collecte, utilise et protège vos données lors de vos envois Chine-Guinée, et comment exercer vos droits."
      intro="Ce que nous faisons des informations que vous nous confiez quand vous expédiez avec DSL Air Cargo, et comment garder la main dessus."
      miseAJour="19 novembre 2026"
      enBref={EN_BREF}
      sections={SECTIONS}
      question="Une question sur vos données ?"
      autrePage={{ to: '/conditions-generales', label: 'Conditions générales' }}
    />
  );
}
