// Nombre au format français (« 12 000 000 »). fr-FR sépare les milliers par une espace fine
// (U+202F) que nos polices dessinent quasi nulle : on la remplace par une espace insécable
// classique, bien visible et qui ne coupe pas le nombre en fin de ligne.
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString('fr-FR', options).replace(/\u202F/g, '\u00A0');
}
