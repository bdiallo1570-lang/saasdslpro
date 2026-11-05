import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sun, Moon, Menu, X, LogOut, KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { NAV_ITEMS } from './navConfig';
import { NavIcon } from './NavIcon';
import { openCommandPalette, openChangePassword } from './commandEvents';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function MobileTopbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="md:hidden sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl dark:border-night-700 dark:bg-night-900/85">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <img src="/images/backgrounds/dsl-logo-200.png" alt="" className="h-8 w-8 rounded-full object-cover" />
          <span className="font-editorial text-xl leading-none text-night-900 dark:text-cream">DSL Air Cargo</span>
        </div>
        <div className="flex items-center gap-1">
          <TopButton onClick={openCommandPalette} label="Rechercher">
            <Search className="h-[18px] w-[18px]" />
          </TopButton>
          <TopButton onClick={toggleTheme} label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </TopButton>
          <TopButton onClick={() => setOpen((o) => !o)} label={open ? 'Fermer le menu' : 'Ouvrir le menu'}>
            <motion.span key={open ? 'x' : 'menu'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} className="flex">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.span>
          </TopButton>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="overflow-hidden border-t border-slate-100 dark:border-night-700"
          >
            <motion.nav
              className="p-2 space-y-0.5"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } } }}
            >
              {items.map((item) => (
                <motion.div
                  key={item.to}
                  variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE_OUT } } }}
                >
                  <NavLink
                    to={item.to}
                    end={item.to === '/reception' || item.to === '/caisse'}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                        isActive
                          ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
                          : 'text-slate-600 active:bg-slate-100 dark:text-slate-300 dark:active:bg-night-800'
                      }`
                    }
                  >
                    <NavIcon icon={item.icon} className="w-[18px] h-[18px]" />
                    {item.label}
                  </NavLink>
                </motion.div>
              ))}
              <motion.button
                variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                onClick={() => {
                  setOpen(false);
                  openChangePassword();
                }}
                className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                <KeyRound className="h-[18px] w-[18px]" />
                Changer mon mot de passe
              </motion.button>
              <motion.button
                variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                onClick={async () => {
                  await logout();
                  navigate('/connexion');
                }}
                className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-500"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Déconnexion
              </motion.button>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TopButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-600 transition-colors active:bg-slate-100 dark:text-slate-300 dark:active:bg-night-800"
    >
      {children}
    </button>
  );
}
