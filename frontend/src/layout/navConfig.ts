import { ROLE_NAMES } from '@/lib/roles';

export interface NavItem {
  label: string;
  to: string;
  icon: 'dashboard' | 'creances' | 'reception' | 'lots' | 'caisse' | 'client' | 'alert' | 'settings';
  roles: string[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard financier',
    to: '/dashboard/financier',
    icon: 'dashboard',
    roles: [ROLE_NAMES.ADMIN],
  },
  {
    label: 'Créances & impayés',
    to: '/creances',
    icon: 'creances',
    roles: [ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_GUINEE],
  },
  {
    label: 'Alertes',
    to: '/alertes',
    icon: 'alert',
    roles: [ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_GUINEE],
  },
  {
    label: 'Réception (Chine)',
    to: '/reception',
    icon: 'reception',
    roles: [ROLE_NAMES.AGENT_CHINE],
  },
  {
    label: 'Lots / Manifeste',
    to: '/lots',
    icon: 'lots',
    roles: [ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_CHINE, ROLE_NAMES.AGENT_GUINEE],
  },
  {
    label: 'Clients',
    to: '/clients',
    icon: 'client',
    roles: [ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_CHINE, ROLE_NAMES.AGENT_GUINEE],
  },
  {
    label: 'Colis enregistrés',
    to: '/reception/consultation',
    icon: 'reception',
    roles: [ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_CHINE],
  },
  {
    label: 'Caisse Madina',
    to: '/caisse',
    icon: 'caisse',
    roles: [ROLE_NAMES.AGENT_GUINEE, ROLE_NAMES.CAISSIER],
  },
  {
    label: 'Caisse (consultation)',
    to: '/caisse/consultation',
    icon: 'caisse',
    roles: [ROLE_NAMES.ADMIN],
  },
  {
    label: 'Écarts de poids',
    to: '/ecarts-poids',
    icon: 'alert',
    roles: [ROLE_NAMES.ADMIN],
  },
  {
    label: 'Taux de change',
    to: '/parametres/taux-change',
    icon: 'settings',
    roles: [ROLE_NAMES.ADMIN],
  },
  {
    label: 'Espace Client',
    to: '/portail-client',
    icon: 'client',
    roles: [ROLE_NAMES.CLIENT],
  },
];
