import { NavItem } from './navConfig';

const PATHS: Record<NavItem['icon'], string> = {
  dashboard: 'M3 13h4v8H3v-8Zm7-8h4v16h-4V5Zm7 4h4v12h-4V9Z',
  creances: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  reception: 'M21 8l-9-5-9 5 9 5 9-5Zm0 0v8l-9 5-9-5V8',
  lots: 'M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  caisse: 'M3 6h18M3 6v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6M3 6l2-3h14l2 3M8 11h8',
  client: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  alert: 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9-3a9 9 0 0 0-.1-1.3l2-1.6-2-3.4-2.4 1a9 9 0 0 0-2.2-1.3L16 2h-4l-.3 2.4a9 9 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.6A9 9 0 0 0 3 12c0 .4 0 .9.1 1.3l-2 1.6 2 3.4 2.4-1a9 9 0 0 0 2.2 1.3L8 22h4l.3-2.4a9 9 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.3Z',
  factures: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 1.5L18.5 9H13V3.5ZM8 13h8m-8 3h5',
};

export function NavIcon({ icon, className = 'w-5 h-5' }: { icon: NavItem['icon']; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d={PATHS[icon]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
