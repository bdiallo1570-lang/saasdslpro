// Miroir de backend/src/config/roles.ts::DEFAULT_PERMISSIONS — doit rester synchronisé
// manuellement avec cette source. Sert uniquement à décider quoi AFFICHER côté frontend
// (onglets, boutons) ; la vérification réelle et faisant autorité reste toujours côté
// backend (requirePermission). Ne jamais traiter ce fichier comme une source de vérité
// de sécurité — seulement de confort d'affichage.
import { ROLE_NAMES, RoleName } from './roles';

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

export function hasPermission(role: string | undefined, permission: string): boolean {
  if (!role) return false;
  return DEFAULT_PERMISSIONS[role as RoleName]?.[permission] === true;
}
