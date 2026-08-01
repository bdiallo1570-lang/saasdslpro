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
    'lots:read': true,
    'lots:write': true,
    'lots:update_status': true,
    'factures:read': true,
    'factures:write': true,
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
  [ROLE_NAMES.AGENT_CHINE]: {
    'clients:read': true,
    'clients:write': true,
    'colis:read': true,
    'colis:write': true,
    'lots:read': true,
    'lots:write': true,
    'lots:update_status': true,
  },
  [ROLE_NAMES.AGENT_GUINEE]: {
    'clients:read': true,
    'colis:read': true,
    'entrepot:read': true,
    'entrepot:write': true,
    'lots:read': true,
    'lots:update_status': true,
    'factures:read': true,
    'caisse:read': true,
    'caisse:write': true,
    'whatsapp:send': true,
  },
  [ROLE_NAMES.CAISSIER]: {
    'clients:read': true,
    'factures:read': true,
    'caisse:read': true,
    'caisse:write': true,
    'whatsapp:send': true,
  },
  [ROLE_NAMES.CLIENT]: {
    'colis:read_own': true,
    'factures:read_own': true,
  },
};
