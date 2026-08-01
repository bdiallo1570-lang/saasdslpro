import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { NAV_ITEMS } from './navConfig';
import { NavIcon } from './NavIcon';

export function MobileTopbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="md:hidden sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-lg dark:border-night-700 dark:bg-night-900/90">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-xs">
            DSL
          </div>
          <span className="font-semibold text-night-900 dark:text-slate-100 text-sm">Air Cargo</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100 dark:border-night-700"
          >
            <nav className="p-2 space-y-1">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`
                  }
                >
                  <NavIcon icon={item.icon} className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
              <button
                onClick={async () => {
                  await logout();
                  navigate('/connexion');
                }}
                className="w-full text-left flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500"
              >
                Déconnexion
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
