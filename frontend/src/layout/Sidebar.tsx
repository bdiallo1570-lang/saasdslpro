import { useState, useEffect, useLayoutEffect, useRef, ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sun, Moon, PanelLeftClose, LogOut, KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { NAV_GROUPS, NAV_ITEMS } from './navConfig';
import { NavIcon } from './NavIcon';
import { getAlertesCritiquesCount } from './alertesCriticalCount';
import { ROLE_NAMES } from '@/lib/roles';
import { IS_MAC, openCommandPalette, openChangePassword } from './commandEvents';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const COLLAPSE_KEY = 'dsl_sidebar_collapsed';

// La Sidebar est remontée à chaque navigation (AppShell est rendu par page) : on retient ici
// la position de la pastille active de la page précédente pour la faire glisser jusqu'à la
// nouvelle, au lieu qu'elle apparaisse sèchement.
let lastPill: { top: number; height: number } | null = null;

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [alertesCritiquesCount, setAlertesCritiquesCount] = useState(0);
  const [pill, setPill] = useState<{ top: number; height: number } | null>(null);
  const [pillFrom] = useState(() => lastPill);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const navRef = useRef<HTMLElement>(null);

  // Compteur d'alertes critiques — mis en cache 60s (voir alertesCriticalCount.ts) car la
  // Sidebar est remontée à chaque navigation : sans ce cache, chaque changement de page relance
  // l'appel réseau.
  useEffect(() => {
    if (user?.role === ROLE_NAMES.ADMIN || user?.role === ROLE_NAMES.AGENT_GUINEE) {
      getAlertesCritiquesCount().then(setAlertesCritiquesCount);
    }
  }, [user?.role]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      // Stockage indisponible (navigation privée) : le repli ne sera simplement pas retenu
    }
  }, [collapsed]);

  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));
  const groups = NAV_GROUPS.map((g) => ({ name: g, items: items.filter((i) => i.group === g) })).filter(
    (g) => g.items.length > 0,
  );

  // Position de la pastille = celle du lien actif. Re-mesurée quand les polices finissent de
  // charger ou que le menu change de taille (les titres de groupe décalent alors les liens).
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const el = nav.querySelector<HTMLElement>('a[aria-current="page"]');
      if (!el) {
        setPill(null);
        return;
      }
      const next = { top: el.offsetTop, height: el.offsetHeight };
      setPill((p) => (p && p.top === next.top && p.height === next.height ? p : next));
      lastPill = next;
    };
    measure();
    const ro = new ResizeObserver(measure);
    Array.from(nav.children).forEach((child) => ro.observe(child));
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [pathname, collapsed, items.length]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 76 : 256 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-night-700 dark:bg-night-950/60"
    >
      {/* Marque */}
      <div className="flex items-center gap-3 px-4 h-16">
        <img
          src="/images/backgrounds/dsl-logo-200.png"
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover shadow-glow-cargo"
        />
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.2 }}
              className="min-w-0 whitespace-nowrap"
            >
              <p className="font-editorial text-[22px] leading-none text-night-900 dark:text-cream">DSL Air Cargo</p>
              <p className="mt-0.5 font-label text-[9px] uppercase tracking-[0.25em] text-slate-400">{user?.role}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recherche / palette de commandes */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={openCommandPalette}
          title="Rechercher (⌘K)"
          className="group flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600 dark:border-night-700 dark:bg-night-800/60 dark:hover:border-night-600 dark:hover:text-slate-300"
        >
          <Search className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Rechercher…</span>
              <kbd className="rounded border border-slate-200 px-1.5 font-label text-[10px] dark:border-night-600">
                {IS_MAC ? '⌘' : 'Ctrl'} K
              </kbd>
            </>
          )}
        </button>
      </div>

      <nav ref={navRef} className="relative flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
        {/* Pastille active : glisse depuis la position de la page précédente */}
        {pill && (
          <motion.span
            aria-hidden="true"
            initial={pillFrom ?? pill}
            animate={pill}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            className="absolute left-3 right-3 rounded-xl bg-gradient-to-r from-sky-500/15 to-sky-500/[0.04] ring-1 ring-inset ring-sky-500/20"
          >
            <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-sky-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
          </motion.span>
        )}

        {groups.map((group) => (
          <div key={group.name} className="mt-4 first:mt-2">
            <p
              className={`mb-1.5 px-3 font-label text-[10px] uppercase tracking-[0.22em] text-slate-500 transition-opacity dark:text-slate-400 ${
                collapsed ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {group.name}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  // « /reception » et « /caisse » ont des sous-pages distinctes dans le menu ;
                  // « /lots » doit rester actif sur la fiche d'un lot (/lots/:id)
                  end={item.to === '/reception' || item.to === '/caisse'}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'text-sky-700 dark:text-sky-300'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-night-900 dark:text-slate-400 dark:hover:bg-night-800 dark:hover:text-slate-100'
                    }`
                  }
                >
                  <span className="relative shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <NavIcon icon={item.icon} className="w-[18px] h-[18px]" />
                    {item.to === '/alertes' && alertesCritiquesCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[1rem] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-white dark:ring-night-950">
                        {alertesCritiquesCount}
                      </span>
                    )}
                  </span>
                  {!collapsed && (
                    <span className="relative truncate transition-transform duration-300 group-hover:translate-x-1">{item.label}</span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Pied : thème, repli, utilisateur */}
      <div className="border-t border-slate-100 p-3 dark:border-night-700">
        <div className={`flex gap-1 ${collapsed ? 'flex-col' : ''}`}>
          <IconButton onClick={toggleTheme} label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={theme}
                initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
                className="flex"
              >
                {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </motion.span>
            </AnimatePresence>
          </IconButton>
          <IconButton onClick={() => setCollapsed((c) => !c)} label={collapsed ? 'Déplier le menu' : 'Réduire le menu'}>
            <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.35, ease: EASE_OUT }} className="flex">
              <PanelLeftClose className="h-[18px] w-[18px]" />
            </motion.span>
          </IconButton>
        </div>

        <div className="mt-2 flex items-center gap-3 rounded-xl px-1.5 py-2">
          <div className="relative h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-cargo-400 to-cargo-600 p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-xs font-bold text-cargo-600 dark:bg-night-900 dark:text-cargo-400">
              {user?.fullName?.charAt(0) ?? '?'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-night-950" />
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-night-800 dark:text-slate-200">{user?.fullName}</p>
                <p className="truncate text-[11px] text-slate-400">En ligne</p>
              </div>
              <button
                type="button"
                onClick={openChangePassword}
                title="Changer mon mot de passe"
                aria-label="Changer mon mot de passe"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-night-900 dark:hover:bg-night-800 dark:hover:text-slate-100"
              >
                <KeyRound className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate('/connexion');
                }}
                title="Déconnexion"
                aria-label="Déconnexion"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

function IconButton({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-9 flex-1 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-night-900 dark:text-slate-400 dark:hover:bg-night-800 dark:hover:text-slate-100"
    >
      {children}
    </button>
  );
}
