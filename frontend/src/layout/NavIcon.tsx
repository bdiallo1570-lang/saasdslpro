import {
  LayoutDashboard,
  HandCoins,
  PackagePlus,
  Package,
  Boxes,
  Landmark,
  Users,
  BellRing,
  Scale,
  Settings2,
  FileText,
  LucideIcon,
} from 'lucide-react';
import { NavItem } from './navConfig';

const ICONS: Record<NavItem['icon'], LucideIcon> = {
  dashboard: LayoutDashboard,
  creances: HandCoins,
  reception: PackagePlus,
  colis: Package,
  lots: Boxes,
  caisse: Landmark,
  client: Users,
  alert: BellRing,
  scale: Scale,
  settings: Settings2,
  factures: FileText,
};

export function NavIcon({ icon, className = 'w-5 h-5' }: { icon: NavItem['icon']; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon className={className} strokeWidth={1.8} />;
}
