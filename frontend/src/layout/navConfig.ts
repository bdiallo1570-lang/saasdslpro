import { ROLE_NAMES } from '@/lib/roles';

export type NavGroup = 'Pilotage' | 'Opérations' | 'Finance' | 'Paramètres';

export interface NavItem {
  label: string;
  to: string;
  icon:
    | 'dashboard'
    | 'creances'
    | 'reception'
    | 'colis'
    | 'lots'
    | 'caisse'
    | 'client'
    | 'alert'
    | 'scale'
    | 'settings'
    | 'factures';
  roles: string[];
  group: NavGroup;
  // Mots-clés supplémentaires pour la palette de commandes (⌘K)
  keywords?: string[];
}

export const NAV_GROUPS: NavGroup[] = ['Pilotage', 'Opérations', 'Finance', 'Paramètres'];

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard financier',
    to: '/dashboard/financier',
    icon: 'dashboard',
    roles: [ROLE_NAMES.ADMIN],
    group: 'Pilotage',
    keywords: ['accueil', 'chiffre', 'ca', 'statistiques'],
  },
  {
    label: 'Créances & impayés',
    to: '/creances',
    icon: 'creances',
    roles: [ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_GUINEE],
    group: 'Pilotage',
    keywords: ['dette', 'solde', 'relance'],
  },
  {
    label: 'Alertes',
    to: '/alertes',
    icon: 'alert',
    roles: [ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_GUINEE],
    group: 'Pilotage',
    keywords: ['notification', 'urgent'],
  },
  {
    label: 'Réception (Chine)',
    to: '/reception',
    icon: 'reception',
    roles: [ROLE_NAMES.AGENT_CHINE],
    group: 'Opérations',
    keywords: ['pesée', 'enregistrer', 'guangzhou'],
  },
  {
    label: 'Lots / Manifeste',
    to: '/lots',
    icon: 'lots',
    roles: [ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_CHINE, ROLE_NAMES.AGENT_GUINEE],
    group: 'Opérations',
    keywords: ['groupage', 'lta', 'awb', 'vol'],
  },
  {
    label: 'Clients',
    to: '/clients',
    icon: 'client',
    roles: [ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_CHINE, ROLE_NAMES.AGENT_GUINEE],
    group: 'Opérations',
    keywords: ['fiche', 'téléphone', 'whatsapp'],
  },
  {
    label: 'Colis enregistrés',
    to: '/reception/consultation',
    icon: 'colis',
    roles: [ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_CHINE],
    group: 'Opérations',
    keywords: ['tracking', 'suivi', 'paquet'],
  },
  {
    label: 'Colis',
    to: '/colis',
    icon: 'colis',
    roles: [ROLE_NAMES.AGENT_GUINEE],
    group: 'Opérations',
    keywords: ['tracking', 'suivi', 'livraison', 'paquet'],
  },
  {
    label: 'Caisse Madina',
    to: '/caisse',
    icon: 'caisse',
    roles: [ROLE_NAMES.AGENT_GUINEE, ROLE_NAMES.CAISSIER],
    group: 'Finance',
    keywords: ['encaisser', 'paiement', 'reçu'],
  },
  {
    label: 'Factures',
    to: '/factures',
    icon: 'factures',
    roles: [ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_GUINEE, ROLE_NAMES.CAISSIER],
    group: 'Finance',
    keywords: ['fac', 'pdf', 'devis'],
  },
  {
    label: 'Caisse (consultation)',
    to: '/caisse/consultation',
    icon: 'caisse',
    roles: [ROLE_NAMES.ADMIN],
    group: 'Finance',
    keywords: ['journal', 'encaissements'],
  },
  {
    label: 'Écarts de poids',
    to: '/ecarts-poids',
    icon: 'scale',
    roles: [ROLE_NAMES.ADMIN],
    group: 'Paramètres',
    keywords: ['pesée', 'différence', 'kg'],
  },
  {
    label: 'Taux de change',
    to: '/parametres/taux-change',
    icon: 'settings',
    roles: [ROLE_NAMES.ADMIN],
    group: 'Paramètres',
    keywords: ['devise', 'usd', 'eur', 'cny', 'gnf'],
  },
  {
    label: 'Espace Client',
    to: '/portail-client',
    icon: 'client',
    roles: [ROLE_NAMES.CLIENT],
    group: 'Pilotage',
  },
];
