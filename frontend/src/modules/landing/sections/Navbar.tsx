import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
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
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 12);
  });

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
      <motion.div
        animate={{ height: scrolled ? 56 : 64 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between"
      >
        <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3">
          <motion.img
            animate={{ width: scrolled ? 36 : 44, height: scrolled ? 36 : 44 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            src="/images/backgrounds/dsl-logo-200.png"
            alt="DSL Air Cargo"
            className="rounded-full object-cover shadow-glow-cargo shrink-0"
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
        </motion.div>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <motion.button
              key={link.label}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => scrollTo(link.href)}
              className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-slate-300 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-night-900 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </motion.button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onToggleTheme}
            aria-label="Basculer le thème clair/sombre"
            className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors overflow-hidden ${
              isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isDark ? 'sun' : 'moon'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="inline-flex"
              >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/connexion')}
            className="hidden sm:inline-flex bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-glow-sky transition-colors"
          >
            Se connecter / Espace SaaS
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileOpen((v) => !v)}
            className={`md:hidden h-9 w-9 flex items-center justify-center rounded-lg ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileOpen ? 'close' : 'menu'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="inline-flex"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

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
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              className="px-4 py-3 space-y-1"
            >
              {NAV_LINKS.map((link) => (
                <motion.button
                  key={link.label}
                  variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => scrollTo(link.href)}
                  className={`block w-full text-left text-sm font-medium px-3 py-2.5 rounded-lg transition-colors ${
                    isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </motion.button>
              ))}
              <motion.button
                variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/connexion')}
                className="w-full mt-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
              >
                Se connecter / Espace SaaS
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
