// Règle 3.1 GEMINI.md — calcul des poids réel/volumétrique/taxable.
// La facturation actuelle utilise TOUJOURS le poids réel ; le poids taxable est
// calculé et stocké mais n'est pas utilisé tant que mode_facturation = "poids_reel".

export function computeVolumetricWeightKg(
  longueurCm: number,
  largeurCm: number,
  hauteurCm: number,
  divisor: number,
): number {
  return (longueurCm * largeurCm * hauteurCm) / divisor;
}

export function computeTaxableWeightKg(poidsReelKg: number, poidsVolumetriqueKg: number): number {
  return Math.max(poidsReelKg, poidsVolumetriqueKg);
}
