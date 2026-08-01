import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Calculateur', href: '#calculateur' },
  { label: 'Suivi de Colis', href: '#suivi' },
  { label: 'Nos Tarifs', href: '#calculateur' },
  { label: 'Espaces Entrepôts', href: '#entrepots' },
];

interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Navbar({ isDark, onToggleTheme }: NavbarProps) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function scrollTo(href: string) {
    setMobileOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors duration-300 ${
        isDark ? 'bg-night-900/80 border-white/10' : 'bg-white/80 border-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/images/backgrounds/dsl-logo.png"
            alt="DSL Air Cargo"
            className="h-11 w-11 rounded-xl object-cover shadow-glow-cargo shrink-0"
          />
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-night-900'}`}>
              DSL Air Cargo
            </span>
            <span
              className={`hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'bg-cargo-500/10 text-cargo-300 border-cargo-500/30'
                  : 'bg-cargo-50 text-cargo-700 border-cargo-200'
              }`}
            >
              Chine ➔ Guinée
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-slate-300 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-night-900 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            aria-label="Basculer le thème clair/sombre"
            className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${
              isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/connexion')}
            className="hidden sm:inline-flex bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-glow-sky transition-colors"
          >
            Se connecter / Espace SaaS
          </motion.button>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className={`md:hidden h-9 w-9 flex items-center justify-center rounded-lg ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`md:hidden overflow-hidden border-t ${
              isDark ? 'border-white/10' : 'border-slate-200'
            }`}
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.href)}
                  className={`block w-full text-left text-sm font-medium px-3 py-2.5 rounded-lg ${
                    isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => navigate('/connexion')}
                className="w-full mt-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
              >
                Se connecter / Espace SaaS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
