// Base de connaissances de l'assistant virtuel — reprend le contenu déjà écrit sur la landing
// (FAQ, tarifs, produits interdits) sous forme d'intentions détectables par mots-clés. Pas
// d'appel réseau, pas de dépendance externe : réponses instantanées, gratuites, illimitées.
// Pour enrichir l'assistant, ajouter une entrée ici plutôt que dupliquer du contenu ailleurs.

export interface Intent {
  id: string;
  keywords: string[];
  answer: string;
  suggestions?: string[]; // questions de relance proposées après cette réponse
}

export const INTENTS: Intent[] = [
  {
    id: 'tarifs',
    keywords: ['prix', 'tarif', 'coût', 'cout', 'combien', 'kg', 'kilo', 'gnf', 'cher'],
    answer:
      "Ça dépend du type de marchandise et du poids réel. Pour du Cargo Standard (habits, chaussures, jouets, articles ménagers…), c'est 160 000 GNF/kg. Pour du Cargo Sensible (batteries, liquides, électronique, cosmétiques…), c'est 180 000 GNF/kg. Utilisez le calculateur plus haut sur cette page pour avoir le prix exact en quelques secondes.",
    suggestions: ['Combien de temps pour le transport ?', 'Comment vous calculez le poids ?'],
  },
  {
    id: 'delai',
    keywords: ['temps', 'délai', 'delai', 'durée', 'duree', 'jours', 'arrive', 'arriver', 'rapide', 'combien de temps'],
    answer:
      "Dès que votre colis est enregistré à notre entrepôt de Guangzhou et casé dans un vol, on vous donne une estimation d'arrivée (ETA) à Conakry. Et dès qu'il est disponible à l'entrepôt de Madina, vous recevez un message WhatsApp automatique — pas besoin de nous relancer.",
    suggestions: ['Comment je suis mon colis ?', 'Où sont vos entrepôts ?'],
  },
  {
    id: 'poids',
    keywords: ['poids', 'peser', 'pesée', 'pesee', 'kilo', 'volumétrique', 'volumetrique', 'écart', 'ecart'],
    answer:
      "On facture au poids réel, celui pesé à la réception en Chine. Si vous nous donnez les dimensions, on calcule aussi un poids volumétrique à titre indicatif, mais c'est toujours le poids réel qui compte pour le montant final. Un écart constaté à l'arrivée est toujours vérifié et communiqué avant le moindre ajustement.",
    suggestions: ['Combien ça coûte ?', 'Comment je suis mon colis ?'],
  },
  {
    id: 'suivi',
    keywords: ['suivre', 'suivi', 'tracking', 'où est', 'ou est', 'statut', 'localiser', 'trouver mon colis'],
    answer:
      "Chaque colis a un numéro de suivi unique dès son enregistrement (genre DSL-2026-00042). Entrez-le dans la barre de suivi tout en haut de cette page pour voir son statut en direct. Vous recevez aussi des notifications automatiques par WhatsApp à chaque étape importante.",
    suggestions: ['Combien de temps pour le transport ?', "Comment vous contacter ?"],
  },
  {
    id: 'interdits',
    keywords: [
      'interdit',
      'interdits',
      'interdite',
      'refusé',
      'refuse',
      'accepté',
      'accepte',
      'envoyer quoi',
      'batterie',
      'liquide',
      'médicament',
      'medicament',
      'arme',
      'contrefaçon',
      'contrefacon',
    ],
    answer:
      "Certains produits sont strictement interdits (armes, drogues, matières dangereuses, contrefaçons…) et d'autres passent sous conditions (batteries, liquides, médicaments réglementés). On a détaillé tout ça dans la section « Produits interdits » un peu plus bas sur cette page. Un doute sur un article précis ? Demandez-nous avant d'envoyer.",
    suggestions: ['Comment bien emballer mon colis ?', 'Combien ça coûte ?'],
  },
  {
    id: 'emballage',
    keywords: ['emballer', 'emballage', 'carton', 'fragile', 'protéger', 'proteger', 'casse'],
    answer:
      "Pour les objets fragiles : double emballage avec papier bulle, calage intérieur, marquage FRAGILE. Pour les liquides autorisés : contenant hermétique + sac plastique. Pour l'électronique : gardez l'emballage d'origine et une batterie toujours intégrée à l'appareil. Tous les détails sont dans la section « Produits interdits et conseils d'emballage » plus bas.",
    suggestions: ['Qu\'est-ce qui est interdit ?', 'Combien ça coûte ?'],
  },
  {
    id: 'paiement',
    keywords: ['payer', 'paiement', 'orange money', 'virement', 'espèces', 'especes', 'régler', 'regler', 'solde'],
    answer:
      "Vous payez au comptoir de Madina, à Conakry — en espèces, Orange Money ou virement. Vous pouvez régler en une fois ou en plusieurs fois, votre solde restant est toujours visible depuis votre espace client.",
    suggestions: ['Où sont vos entrepôts ?', 'Comment je suis mon colis ?'],
  },
  {
    id: 'entrepots',
    keywords: ['entrepôt', 'entrepot', 'adresse', 'guangzhou', 'madina', 'conakry', 'où êtes', 'ou etes', 'localisation'],
    answer:
      "Un entrepôt à Guangzhou (Chine) pour la réception et l'enregistrement de vos colis, et un à Madina, Conakry, pour la réception, le dédouanement et la remise de vos marchandises. Les adresses complètes sont dans la section « Entrepôts » plus haut sur cette page.",
    suggestions: ['Comment je suis mon colis ?', "Comment vous contacter ?"],
  },
  {
    id: 'compte',
    keywords: ['compte', 'inscription', 'inscrire', 'sans compte', 'créer un compte', 'creer un compte'],
    answer:
      "Chaque envoi est rattaché à une fiche client (nom, téléphone) pour qu'on puisse suivre et facturer correctement. C'est gratuit et ça prend deux minutes : il suffit de donner vos infos au dépôt de votre premier colis.",
    suggestions: ['Combien ça coûte ?', "Comment vous contacter ?"],
  },
  {
    id: 'contact',
    keywords: ['contact', 'contacter', 'whatsapp', 'joindre', 'appeler', 'téléphone', 'telephone', 'question', 'aide', 'humain', 'agent'],
    answer:
      "Le plus rapide, c'est WhatsApp — vous trouverez le lien juste en dessous. Vous pouvez aussi passer directement à nos entrepôts de Guangzhou ou Madina. Pour une question sur un colis précis, gardez votre numéro de suivi sous la main.",
    suggestions: ['Combien ça coûte ?', "Qu'est-ce qui est interdit ?"],
  },
  {
    id: 'salutation',
    keywords: ['bonjour', 'salut', 'bonsoir', 'hello', 'coucou', 'yo'],
    answer:
      "Bonjour ! Moi c'est Oury, l'assistant DSL Air Cargo. Je peux vous renseigner sur les tarifs, les délais, le suivi de colis, les produits interdits ou le paiement. Qu'est-ce qui vous intéresse ?",
    suggestions: ['Combien ça coûte ?', 'Comment je suis mon colis ?', "Qu'est-ce qui est interdit ?"],
  },
  {
    id: 'identite',
    keywords: ['ton nom', 'tu t\'appelles', 'qui es-tu', 'qui es tu', 'oury', 'c\'est qui', 'tu es qui'],
    answer:
      "Je m'appelle Oury, l'assistant virtuel de DSL Air Cargo ! Je suis là pour répondre à vos questions sur les tarifs, les délais, le suivi de colis et tout ce qui concerne vos envois entre la Chine et la Guinée.",
    suggestions: ['Combien ça coûte ?', 'Comment je suis mon colis ?'],
  },
  {
    id: 'merci',
    keywords: ['merci', 'super', 'parfait', 'top', 'cool'],
    answer: "Avec plaisir ! Autre chose que je peux vous expliquer ?",
    suggestions: ['Combien ça coûte ?', 'Comment je suis mon colis ?'],
  },
];

export const FALLBACK_ANSWER =
  "Je n'ai pas de réponse toute prête pour cette question précise. Le plus sûr, c'est de nous écrire directement sur WhatsApp — on vous répond rapidement.";

export const WELCOME_MESSAGE =
  "Bonjour ! Moi c'est Oury 👋 l'assistant DSL Air Cargo. Posez-moi une question sur les tarifs, les délais, le suivi de colis ou les produits interdits.";

export const STARTER_SUGGESTIONS = [
  'Combien ça coûte ?',
  'Comment je suis mon colis ?',
  "Qu'est-ce qui est interdit ?",
  'Comment payer ?',
];

// Trouve l'intention correspondant le mieux au message — score simple par nombre de mots-clés
// trouvés (insensible à la casse/accents basique). Retourne null si rien ne dépasse le seuil.
export function matchIntent(message: string): Intent | null {
  const normalized = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // retire les accents pour un matching plus robuste

  let best: { intent: Intent; score: number } | null = null;

  for (const intent of INTENTS) {
    const score = intent.keywords.reduce((count, kw) => {
      const kwNormalized = kw
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
      return normalized.includes(kwNormalized) ? count + 1 : count;
    }, 0);
    if (score > 0 && (!best || score > best.score)) {
      best = { intent, score };
    }
  }

  return best?.intent ?? null;
}
