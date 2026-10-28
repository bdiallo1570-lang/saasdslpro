import { Client, Facture, Paiement } from '@prisma/client';

// Rôles autorisés à voir prix de vente / marges / créances client sur les réponses colis.
// L'Agent Chine fixe le prix à la création et peut le modifier ensuite (tant qu'aucun paiement
// n'est enregistré, voir colis.service.ts::updateColisPrice) — il doit donc le voir. L'Agent
// Guinée gère l'encaissement, il doit voir montant dû/payé/reste. Le filtrage se fait ici, en
// sortie, jamais sur le calcul/stockage.
const PRICING_ROLES = new Set(['Admin', 'Caissier', 'Agent Guinée', 'Agent Chine']);

export function canReadPricing(roleName: string): boolean {
  return PRICING_ROLES.has(roleName);
}

type FactureAvecPaiements = Facture & { paiements: Paiement[] };
type ColisWithClient = Record<string, unknown> & {
  client: Client;
  facture?: FactureAvecPaiements | null;
};

// Règle 3.4 GEMINI.md : un colis ne sort de l'entrepôt que si sa facture est payée, ou
// débloquée manuellement par un admin (tracé à l'audit). Sans facture, la sortie est bloquée.
// Seule source de cette règle — utilisée par la livraison, le scan et le bon de sortie.
export function livraisonAutorisee(
  facture: { status: string; livraisonDebloqueeManuel: boolean } | null | undefined,
): boolean {
  return !!facture && (facture.status === 'PAYE' || facture.livraisonDebloqueeManuel);
}

export type StatutPaiementColis = 'IMPAYE' | 'PARTIEL' | 'SOLDE' | 'TROP_PERCU';

// Calcule montant dû/payé/reste/trop-perçu en GNF pour un colis, à partir de sa facture
// (facturation auto 1 colis = 1 facture, module Agent Guinée). Dérivé à la volée, jamais stocké
// — même principe que les créances existantes (source de vérité = Facture/Paiement).
export function computePaiementColis(facture: FactureAvecPaiements | null | undefined) {
  if (!facture) {
    return {
      montantDuGnf: 0,
      montantPayeGnf: 0,
      resteAPayerGnf: 0,
      tropPercuGnf: 0,
      statutPaiement: 'IMPAYE' as StatutPaiementColis,
    };
  }

  // montantTotal est déjà dans la devise de la facture ; pour un colis en devise étrangère,
  // le montantTotal reste dans cette devise — le montant dû "en GNF" utilise le taux figé
  // du premier paiement dans cette devise, ou le premier paiement avec taux > 1, ou le taux figé du lot.
  let referenceTaux = 1;
  if (facture.currency !== 'GNF') {
    const pMemeDevise = facture.paiements.find((p) => p.currency === facture.currency);
    if (pMemeDevise) {
      referenceTaux = Number(pMemeDevise.tauxVersGnf);
    } else {
      const pAvecTaux = facture.paiements.find((p) => Number(p.tauxVersGnf) > 1);
      if (pAvecTaux) {
        referenceTaux = Number(pAvecTaux.tauxVersGnf);
      } else {
        const lotTaux = (facture as { colis?: { lot?: { tauxVersGnfFige?: unknown } | null }[] })
          .colis?.find((c) => c.lot?.tauxVersGnfFige)?.lot?.tauxVersGnfFige;
        if (lotTaux) {
          referenceTaux = Number(lotTaux);
        }
      }
    }
  }

  const montantDuGnf =
    facture.currency === 'GNF' ? Number(facture.montantTotal) : Number(facture.montantTotal) * referenceTaux;
  const montantPayeGnf = facture.paiements.reduce(
    (sum, p) => sum + Number(p.montant) * Number(p.tauxVersGnf),
    0,
  );
  const resteAPayerGnf = Math.max(0, montantDuGnf - montantPayeGnf);
  const tropPercuGnf = Math.max(0, montantPayeGnf - montantDuGnf);

  let statutPaiement: StatutPaiementColis;
  if (tropPercuGnf > 0) statutPaiement = 'TROP_PERCU';
  else if (montantPayeGnf <= 0) statutPaiement = 'IMPAYE';
  else if (resteAPayerGnf > 0) statutPaiement = 'PARTIEL';
  else statutPaiement = 'SOLDE';

  return { montantDuGnf, montantPayeGnf, resteAPayerGnf, tropPercuGnf, statutPaiement };
}

// Retire montantEstime/currency/pricingRuleId (prix/marge) de la réponse si le rôle appelant
// n'a pas colis:read_pricing — et masque en cascade les champs de facturation du client
// imbriqué (totalSpent/outstandingBalance). categorieTarif est conservée : c'est une
// classification produit (standard/à risque), utile à la manutention, pas un prix ni une marge.
// Si `colis.facture` est chargée (avec ses paiements), ajoute les champs dérivés de paiement
// (montantDuGnf/montantPayeGnf/resteAPayerGnf/statutPaiement) pour les rôles autorisés.
export function presentColis<T extends ColisWithClient>(colis: T, roleName: string) {
  const paiementInfo = 'facture' in colis ? computePaiementColis(colis.facture) : null;

  if (canReadPricing(roleName)) {
    return {
      ...colis,
      client: presentClient(colis.client, roleName),
      ...(paiementInfo ?? {}),
    };
  }
  const { montantEstime, currency, pricingRuleId, client, ...rest } = colis;
  return { ...rest, client: presentClient(client, roleName) };
}

export function presentClient<T extends Client>(client: T, roleName: string) {
  if (canReadPricing(roleName)) return client;
  const { totalSpent, outstandingBalance, ...rest } = client;
  return rest;
}
