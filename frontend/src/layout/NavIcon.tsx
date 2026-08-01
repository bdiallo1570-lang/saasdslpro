import { NavItem } from './navConfig';

const PATHS: Record<NavItem['icon'], string> = {
  dashboard: 'M3 13h4v8H3v-8Zm7-8h4v16h-4V5Zm7 4h4v12h-4V9Z',
  creances: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  reception: 'M21 8l-9-5-9 5 9 5 9-5Zm0 0v8l-9 5-9-5V8',
  lots: 'M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  caisse: 'M3 6h18M3 6v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6M3 6l2-3h14l2 3M8 11h8',
  client: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
};

export function NavIcon({ icon, className = 'w-5 h-5' }: { icon: NavItem['icon']; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d={PATHS[icon]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
