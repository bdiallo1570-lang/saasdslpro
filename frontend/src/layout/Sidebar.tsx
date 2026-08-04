import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { NAV_ITEMS } from './navConfig';
import { NavIcon } from './NavIcon';
import { listAlertes } from '@/modules/alertes/alertes.api';
import { ROLE_NAMES } from '@/lib/roles';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [alertesCritiquesCount, setAlertesCritiquesCount] = useState(0);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Compteur d'alertes critiques — chargé une fois au montage (pas de polling agressif),
  // pour les rôles ayant accès à /alertes uniquement.
  useEffect(() => {
    if (user?.role === ROLE_NAMES.ADMIN || user?.role === ROLE_NAMES.AGENT_GUINEE) {
      listAlertes({ niveau: 'CRITIQUE' })
        .then((alertes) => setAlertesCritiquesCount(alertes.length))
        .catch(() => setAlertesCritiquesCount(0));
    }
  }, [user?.role]);

  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-200 bg-white dark:border-night-700 dark:bg-night-900/60 dark:backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-100 dark:border-night-700">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-sm shadow-glow-sky">
          DSL
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-semibold text-night-900 dark:text-slate-100 whitespace-nowrap overflow-hidden"
            >
              Air Cargo
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-night-700 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-sky-500"
                  />
                )}
                <span className="relative shrink-0">
                  <NavIcon icon={item.icon} className="w-5 h-5" />
                  {item.to === '/alertes' && alertesCritiquesCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[1rem] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
                      {alertesCritiquesCount}
                    </span>
                  )}
                </span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 dark:border-night-700 p-2 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-night-700 transition-colors"
        >
          <span className="w-5 h-5 shrink-0 flex items-center justify-center">
            {theme === 'dark' ? '☀️' : '🌙'}
          </span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-night-700 transition-colors"
        >
          <motion.span
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="w-5 h-5 shrink-0 flex items-center justify-center"
          >
            ◀
          </motion.span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Réduire
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 shrink-0 rounded-full bg-cargo-500/15 text-cargo-500 flex items-center justify-center text-xs font-bold">
            {user?.fullName?.charAt(0) ?? '?'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden flex-1 min-w-0"
              >
                <p className="text-xs font-medium text-night-800 dark:text-slate-200 truncate">
                  {user?.fullName}
                </p>
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/connexion');
                  }}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Déconnexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
