import { useSyncExternalStore } from 'react';
import { apiClient, ApiResponse } from '@/lib/apiClient';
import { formatNumber } from '@/lib/format';

// Tarifs au kilo publiés sur la landing, lus en base (GET /pricing) : aucun prix n'est écrit en
// dur dans le site, un changement de tarif côté base est visible immédiatement. Un seul appel
// réseau pour toute la page (calculateur, FAQ, assistant, accroche de la vidéo).

export type PublicCategory = 'STANDARD' | 'RISQUE';

interface PricingRow {
  categoryName: PublicCategory;
  pricePerKg: number;
}

export type PricingState =
  | { status: 'loading' }
  | { status: 'ready'; prices: Partial<Record<PublicCategory, number>> }
  | { status: 'error' };

let state: PricingState = { status: 'loading' };
let started = false;
const listeners = new Set<() => void>();

function setState(next: PricingState) {
  state = next;
  listeners.forEach((l) => l());
}

async function load(attempt = 0): Promise<void> {
  try {
    const res = await apiClient.get<ApiResponse<PricingRow[]>>('/pricing');
    const prices: Partial<Record<PublicCategory, number>> = {};
    for (const row of res.data.data ?? []) prices[row.categoryName] = row.pricePerKg;
    setState({ status: 'ready', prices });
  } catch {
    // Le serveur gratuit peut mettre quelques secondes à se réveiller : deux nouvelles tentatives
    if (attempt < 2) {
      setTimeout(() => load(attempt + 1), 2000 * (attempt + 1));
    } else {
      setState({ status: 'error' });
    }
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    load();
  }
  return () => listeners.delete(listener);
}

export function getPricingSnapshot(): PricingState {
  return state;
}

export function usePublicPricing(): PricingState {
  return useSyncExternalStore(subscribe, getPricingSnapshot, getPricingSnapshot);
}

export function priceOf(s: PricingState, category: PublicCategory): number | null {
  return s.status === 'ready' ? (s.prices[category] ?? null) : null;
}

export function formatPricePerKg(value: number): string {
  return `${formatNumber(value)} GNF/kg`;
}

// Phrase tarifaire réutilisée par la FAQ et l'assistant. Sans tarifs chargés, on renvoie vers le
// calculateur plutôt que d'afficher un chiffre qui pourrait être faux.
export function pricingSentence(s: PricingState): string {
  const standard = priceOf(s, 'STANDARD');
  const sensible = priceOf(s, 'RISQUE');
  if (standard === null || sensible === null) {
    return 'Le tarif au kilo est fixe et dépend de la catégorie : Cargo Standard (habits, chaussures, jouets, articles ménagers…) ou Cargo Sensible (batteries, liquides, électronique, cosmétiques…).';
  }
  return `Pour du Cargo Standard (habits, chaussures, jouets, articles ménagers…), c'est ${formatPricePerKg(standard)}. Pour du Cargo Sensible (batteries, liquides, électronique, cosmétiques…), c'est ${formatPricePerKg(sensible)}.`;
}

// Remplace le repère {{tarifs}} d'un texte par la phrase tarifaire à jour
export function withPrices(text: string, s: PricingState = state): string {
  return text.replace('{{tarifs}}', pricingSentence(s));
}
