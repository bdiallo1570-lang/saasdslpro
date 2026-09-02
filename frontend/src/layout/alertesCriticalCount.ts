import { listAlertes } from '@/modules/alertes/alertes.api';

// Cache module-level (survit aux remontages de la Sidebar, qui se remonte à chaque
// navigation car AppShell n'est pas encore partagé au niveau du routeur) — évite de refaire
// l'aller-retour réseau vers la base à chaque changement de page pour un simple compteur.
const TTL_MS = 60_000;
let cached: { count: number; fetchedAt: number } | null = null;
let pending: Promise<number> | null = null;

export async function getAlertesCritiquesCount(): Promise<number> {
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return cached.count;
  }
  if (pending) return pending;

  pending = listAlertes({ niveau: 'CRITIQUE' })
    .then((alertes) => {
      cached = { count: alertes.length, fetchedAt: Date.now() };
      return cached.count;
    })
    .catch(() => 0)
    .finally(() => {
      pending = null;
    });

  return pending;
}
