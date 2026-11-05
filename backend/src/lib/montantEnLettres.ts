// Montant en toutes lettres, en français, pour la mention « Arrêté le présent reçu à la somme
// de … » des reçus. Règles d'accord : « vingt » et « cent » prennent un s quand ils sont
// multipliés et terminent le nombre (quatre-vingts, deux cents) ou précèdent million/milliard
// (deux cents millions), jamais devant « mille » (deux cent mille), qui reste invariable.

const UNITES = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf',
];
const DIZAINES = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

// 0 à 99. `pluriel` : autorise le s de « quatre-vingts » (fin de nombre ou devant million/milliard)
function moinsDeCent(n: number, pluriel: boolean): string {
  if (n < 20) return UNITES[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (d === 7 || d === 9) {
    // 70-79 = soixante + 10..19 ; 90-99 = quatre-vingt + 10..19
    const reste = 10 + u;
    if (d === 7) return reste === 11 ? 'soixante et onze' : `soixante-${UNITES[reste]}`;
    return `quatre-vingt-${UNITES[reste]}`;
  }
  if (d === 8) return u === 0 ? (pluriel ? 'quatre-vingts' : 'quatre-vingt') : `quatre-vingt-${UNITES[u]}`;
  if (u === 0) return DIZAINES[d];
  if (u === 1) return `${DIZAINES[d]} et un`;
  return `${DIZAINES[d]}-${UNITES[u]}`;
}

// 0 à 999
function moinsDeMille(n: number, pluriel: boolean): string {
  const c = Math.floor(n / 100);
  const r = n % 100;
  if (c === 0) return moinsDeCent(r, pluriel);
  const cent = c === 1 ? 'cent' : `${UNITES[c]} cent${r === 0 && pluriel ? 's' : ''}`;
  return r === 0 ? cent : `${cent} ${moinsDeCent(r, pluriel)}`;
}

export function nombreEnLettres(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return 'zéro';

  const milliards = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const milliers = Math.floor((n % 1_000_000) / 1000);
  const reste = n % 1000;

  const parts: string[] = [];
  if (milliards) parts.push(`${moinsDeMille(milliards, true)} milliard${milliards > 1 ? 's' : ''}`);
  if (millions) parts.push(`${moinsDeMille(millions, true)} million${millions > 1 ? 's' : ''}`);
  if (milliers) parts.push(milliers === 1 ? 'mille' : `${moinsDeMille(milliers, false)} mille`);
  if (reste) parts.push(moinsDeMille(reste, true));
  return parts.join(' ');
}

const DEVISES: Record<string, [string, string]> = {
  GNF: ['franc guinéen', 'francs guinéens'],
  USD: ['dollar américain', 'dollars américains'],
  CNY: ['yuan', 'yuans'],
  EUR: ['euro', 'euros'],
};

// « Quatre cent quatre-vingt mille francs guinéens » — majuscule initiale, devise accordée
export function montantEnLettres(value: number, currency = 'GNF'): string {
  const n = Math.floor(Math.abs(value));
  const [singulier, pluriel] = DEVISES[currency] ?? [currency, currency];
  // « un million de francs » : « de » après un million ou un milliard rond
  const rond = n >= 1_000_000 && n % 1_000_000 === 0;
  const texte = `${nombreEnLettres(n)} ${rond ? 'de ' : ''}${n > 1 ? pluriel : singulier}`;
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}
