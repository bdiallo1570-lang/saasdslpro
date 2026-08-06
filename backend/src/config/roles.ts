// Rôles applicatifs DSL Air-Cargo et permissions associées.
// Les permissions sont stockées en base (Role.permissionsJson) ; ce fichier sert
// de référence pour le seed initial et pour la vérification des accès financiers.

export const ROLE_NAMES = {
  ADMIN: 'Admin',
  AGENT_CHINE: 'Agent Chine',
  AGENT_GUINEE: 'Agent Guinée',
  CAISSIER: 'Caissier',
  CLIENT: 'Client',
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

// Chemin de redirection post-connexion par rôle (règle métier §2 GEMINI.md)
export const ROLE_DASHBOARD_ROUTE: Record<RoleName, string> = {
  [ROLE_NAMES.ADMIN]: '/dashboard/financier',
  [ROLE_NAMES.AGENT_CHINE]: '/reception',
  [ROLE_NAMES.AGENT_GUINEE]: '/caisse',
  [ROLE_NAMES.CAISSIER]: '/caisse',
  [ROLE_NAMES.CLIENT]: '/portail-client',
};

// Permissions par défaut injectées au seed. Les vues financières / marges
// bénéficiaires (finance:read_margins, dashboard:financier) sont réservées à l'Admin.
export const DEFAULT_PERMISSIONS: Record<RoleName, Record<string, boolean>> = {
  [ROLE_NAMES.ADMIN]: {
    'dashboard:financier': true,
    'finance:read_margins': true,
    'clients:read': true,
    'clients:write': true,
    'colis:read': true,
    'colis:write': true,
    'colis:update_status': true,
    'colis:read_pricing': true,
    'colis:write_pricing': true,
    'colis:read_discrepancy_alerts': true,
    'lots:read': true,
    'lots:write': true,
    'lots:update_status': true,
    'lots:read_costs': true,
    'lots:write_costs': true,
    'lots:delete_costs': true,
    'factures:read': true,
    'factures:write': true,
    'paiements:write': true,
    'caisse:read': true,
    'caisse:write': true,
    'entrepot:read': true,
    'entrepot:write': true,
    'parametres:read': true,
    'parametres:write': true,
    'audit:read': true,
    'utilisateurs:write': true,
    'livraison:deblocage_force': true,
    'whatsapp:send': true,
  },
  // Agent Chine : fixe le prix à la réception (poids × tarif en vigueur) et peut le corriger
  // ensuite tant qu'aucun paiement n'a été enregistré sur le colis (colis:write_pricing —
  // voir colis.service.ts::updateColisPrice, toute modification est tracée dans AuditLog avec
  // motif obligatoire). Ne voit toujours pas les marges globales ni les créances (pas de
  // finance:read_margins, pas de factures:read) — seul le prix de son propre colis lui est
  // accessible, pas la vue financière transversale de l'entreprise.
  // audit:read accordée pour le fil d'actualité transversal (le controller audit filtre déjà les
  // métadonnées exposées, aucune marge globale n'y transite).
  [ROLE_NAMES.AGENT_CHINE]: {
    'clients:read': true,
    'clients:write': true,
    'colis:read': true,
    'colis:write': true,
    'colis:update_status': true,
    'colis:read_pricing': true,
    'colis:write_pricing': true,
    'lots:read': true,
    'lots:write': true,
    'lots:update_status': true,
    'audit:read': true,
  },
  // Agent Guinée : ne peut jamais modifier le poids saisi en Chine, seulement signaler un écart constaté.
  // colis:read_pricing accordée (contrairement à l'Agent Chine) — l'Agent Guinée gère l'encaissement
  // et doit voir montant dû/payé/reste par colis pour le module Dépenses/Paiements/Rentabilité.
  // colis:update_status (mais PAS colis:write) — peut faire avancer un colis individuel (ex: En
  // dédouanement, Disponible entrepôt) sans pouvoir créer/modifier le contenu du colis lui-même.
  [ROLE_NAMES.AGENT_GUINEE]: {
    'clients:read': true,
    'colis:read': true,
    'colis:update_status': true,
    'colis:read_pricing': true,
    'colis:report_weight_discrepancy': true,
    'entrepot:read': true,
    'entrepot:write': true,
    'lots:read': true,
    'lots:update_status': true,
    'lots:read_costs': true,
    'lots:write_costs': true,
    'finance:read_margins': true,
    'factures:read': true,
    'paiements:write': true,
    'caisse:read': true,
    'caisse:write': true,
    'whatsapp:send': true,
    'audit:read': true,
  },
  [ROLE_NAMES.CAISSIER]: {
    'clients:read': true,
    'factures:read': true,
    'colis:read_pricing': true,
    'paiements:write': true,
    'caisse:read': true,
    'caisse:write': true,
    'whatsapp:send': true,
  },
  [ROLE_NAMES.CLIENT]: {
    'colis:read_own': true,
    'factures:read_own': true,
  },
};
