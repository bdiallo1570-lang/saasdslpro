// Doit rester synchronisé avec backend/src/config/roles.ts

export const ROLE_NAMES = {
  ADMIN: 'Admin',
  AGENT_CHINE: 'Agent Chine',
  AGENT_GUINEE: 'Agent Guinée',
  CAISSIER: 'Caissier',
  CLIENT: 'Client',
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

export const ROLE_DASHBOARD_ROUTE: Record<string, string> = {
  [ROLE_NAMES.ADMIN]: '/dashboard/financier',
  [ROLE_NAMES.AGENT_CHINE]: '/reception',
  [ROLE_NAMES.AGENT_GUINEE]: '/caisse',
  [ROLE_NAMES.CAISSIER]: '/caisse',
  [ROLE_NAMES.CLIENT]: '/portail-client',
};
