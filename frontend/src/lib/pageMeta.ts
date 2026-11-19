import { useEffect } from 'react';

// Titre d'onglet, description et balises de partage propres à chaque page. Les valeurs d'origine
// (celles d'index.html, pensées pour l'accueil) sont relues une fois et restaurées quand la page
// est quittée. Les aperçus WhatsApp/Facebook lisent index.html sans exécuter le JavaScript : ils
// montrent donc toujours l'accueil ; ces balises servent aux onglets et aux moteurs de recherche.

const MARQUE = 'DSL Air Cargo';

interface PageMeta {
  // Titre de la page, sans le nom du site (ajouté automatiquement) ; absent = titre de l'accueil
  titre?: string;
  description?: string;
  // false : la page ne doit pas apparaître dans les moteurs de recherche
  indexable?: boolean;
}

function balise(selecteur: string, attribut: 'name' | 'property', cle: string): HTMLMetaElement {
  let el = document.head.querySelector<HTMLMetaElement>(selecteur);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribut, cle);
    document.head.appendChild(el);
  }
  return el;
}

const description = () => balise('meta[name="description"]', 'name', 'description');
const ogTitre = () => balise('meta[property="og:title"]', 'property', 'og:title');
const ogDescription = () => balise('meta[property="og:description"]', 'property', 'og:description');
const twTitre = () => balise('meta[name="twitter:title"]', 'name', 'twitter:title');
const twDescription = () => balise('meta[name="twitter:description"]', 'name', 'twitter:description');

// Valeurs d'index.html, relues au premier appel
let defauts: { titre: string; description: string } | null = null;
function lireDefauts() {
  if (!defauts) defauts = { titre: document.title, description: description().content };
  return defauts;
}

function appliquer(titre: string, desc: string, indexable: boolean) {
  document.title = titre;
  for (const el of [description(), ogDescription(), twDescription()]) el.content = desc;
  for (const el of [ogTitre(), twTitre()]) el.content = titre;
  const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (indexable) robots?.remove();
  else balise('meta[name="robots"]', 'name', 'robots').content = 'noindex, nofollow';
}

export function usePageMeta({ titre, description: desc, indexable = true }: PageMeta) {
  useEffect(() => {
    const d = lireDefauts();
    appliquer(titre ? `${titre} · ${MARQUE}` : d.titre, desc ?? d.description, indexable);
    return () => appliquer(d.titre, d.description, true);
  }, [titre, desc, indexable]);
}
