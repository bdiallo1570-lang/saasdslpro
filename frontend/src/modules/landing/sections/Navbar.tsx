import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { ArrowUpRight, Menu, X, Sun, Moon } from 'lucide-react';
import { scrollToId } from '@/lib/smoothScroll';
import { Magnetic, SplitLetters } from './motionKit';

// Un lien = une section distincte (l'ancien menu pointait deux fois vers le calculateur).
const NAV_LINKS = [
  { label: 'Tarifs', id: 'calculateur' },
  { label: 'Entrepôts', id: 'entrepots' },
  { label: 'Produits interdits', id: 'produits-interdits' },
  { label: 'FAQ', id: 'faq' },
];

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_IN_OUT = 'cubic-bezier(0.76,0,0.24,1)';

interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  // Vrai quand l'ouverture animée s'ouvre : la barre de menu descend alors et se compose.
  ready?: boolean;
}

// Texte qui « roule » au survol : le mot monte et est remplacé par son double qui arrive d'en
// dessous. Aucun JavaScript au survol — deux couches et un transform CSS, donc très fluide.
function RollText({ children }: { children: string }) {
  return (
    <span className="relative block overflow-hidden leading-tight">
      <span
        className="block transition-transform duration-500 group-hover:-translate-y-full"
        style={{ transitionTimingFunction: EASE_IN_OUT }}
      >
        {children}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 block translate-y-full transition-transform duration-500 group-hover:translate-y-0"
        style={{ transitionTimingFunction: EASE_IN_OUT }}
      >
        {children}
      </span>
    </span>
  );
}

export function Navbar({ isDark, onToggleTheme, ready = true }: NavbarProps) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Tant que la vidéo d'accueil est sous la barre, le menu devient une vitre sombre qui la laisse
  // voir ; dès qu'on en sort, il reprend le thème de la page.
  const [overHero, setOverHero] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const lastY = useRef(0);
  const onDark = isDark || overHero;
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 12);
    const hero = document.getElementById('suivi');
    if (hero) setOverHero(y < hero.offsetTop + hero.offsetHeight - 96);
    // La barre se range en descendant (plus de place pour le contenu) et revient dès qu'on remonte.
    const delta = y - lastY.current;
    if (y < 160 || delta < -2) setHidden(false);
    else if (delta > 2) setHidden(true);
    lastY.current = y;
  });

  // Section « active » : celle qui traverse le tiers haut de l'écran
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-35% 0px -60% 0px' },
    );
    for (const { id } of NAV_LINKS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  function go(id: string) {
    setMobileOpen(false);
    scrollToId(id);
  }

  const linkTone = onDark ? 'text-slate-200 hover:text-white' : 'text-slate-600 hover:text-night-900';
  const pillTone = onDark ? 'bg-white/[0.2] ring-1 ring-white/30' : 'bg-slate-900/[0.1] ring-1 ring-slate-900/15';

  return (
    <motion.header
      initial={{ y: '-100%' }}
      animate={{ y: ready && !(hidden && !mobileOpen) ? '0%' : '-100%' }}
      transition={{ duration: ready ? 0.7 : 0, ease: EASE_OUT }}
      className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors duration-300 ${
        overHero
          ? 'bg-black/25 border-white/10'
          : isDark
            ? 'bg-night-900/80 border-white/10'
            : 'bg-white/80 border-slate-200'
      }`}
    >
      <motion.div
        animate={{ height: scrolled ? 56 : 64 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between"
      >
        {/* Marque : logo qui pivote au survol, nom qui se compose lettre par lettre */}
        <button
          type="button"
          onClick={() => go('suivi')}
          aria-label="DSL Air Cargo — retour à l'accueil"
          className="group flex items-center gap-3"
        >
          <motion.img
            animate={{ width: scrolled ? 36 : 44, height: scrolled ? 36 : 44 }}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.25, ease: 'easeOut', rotate: { duration: 0.9, ease: EASE_OUT } }}
            src="/images/backgrounds/dsl-logo-200.png"
            alt=""
            className="rounded-full object-cover shadow-glow-cargo shrink-0"
          />
          <span
            className={`font-editorial text-[26px] sm:text-[30px] font-normal leading-none tracking-normal ${
              onDark ? 'text-white' : 'text-night-900'
            }`}
          >
            <SplitLetters text="DSL Air Cargo" play={ready} delay={0.35} stagger={0.035} />
          </span>
          <span
            className={`hidden lg:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full border ${
              onDark
                ? 'bg-cargo-500/10 text-cargo-300 border-cargo-500/30'
                : 'bg-cargo-50 text-cargo-700 border-cargo-200'
            }`}
          >
            Chine ➔ Guinée
          </span>
        </button>

        {/* Liens : repère qui glisse d'un lien à l'autre, texte qui roule au survol */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
          {NAV_LINKS.map((link, i) => {
            const isActive = active === link.id;
            return (
              <motion.button
                key={link.id}
                type="button"
                initial={{ opacity: 0, y: -14 }}
                animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: -14 }}
                transition={{ duration: 0.7, ease: EASE_OUT, delay: ready ? 0.5 + i * 0.07 : 0 }}
                onClick={() => go(link.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`group relative rounded-full px-4 py-1.5 font-editorial text-[21px] font-normal leading-none tracking-normal transition-colors ${linkTone}`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className={`absolute inset-0 -z-0 rounded-full ${pillTone}`}
                  />
                )}
                <span className="relative">
                  <RollText>{link.label}</RollText>
                </span>
              </motion.button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onToggleTheme}
            aria-label="Basculer le thème clair/sombre"
            className={`h-9 w-9 flex items-center justify-center rounded-full transition-colors overflow-hidden ${
              onDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'
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

          <Magnetic strength={0.2} className="hidden sm:block">
            <motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: ready ? 0.95 : 0 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/connexion')}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-sky-500 pl-4 pr-3 py-2 font-display text-[13px] font-bold tracking-wide text-white shadow-glow-sky transition-colors hover:bg-sky-400"
            >
              {/* Reflet qui traverse le bouton au survol */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/4 -skew-x-12 bg-white/30 opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100"
              />
              <span className="relative">
                <RollText>Espace SaaS</RollText>
              </span>
              <ArrowUpRight
                size={15}
                className="relative transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </motion.button>
          </Magnetic>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
            className={`md:hidden h-9 w-9 flex items-center justify-center rounded-full ${
              onDark ? 'text-slate-200' : 'text-slate-600'
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

      {/* Menu mobile : grands liens qui se lèvent un à un depuis un masque */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className={`md:hidden overflow-hidden border-t ${
              onDark ? 'border-white/10 bg-night-950/90' : 'border-slate-200 bg-white/95'
            }`}
          >
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } } }}
              className="px-6 py-6 flex flex-col gap-1"
            >
              {NAV_LINKS.map((link, i) => (
                <span key={link.id} className="block overflow-hidden">
                  <motion.button
                    type="button"
                    variants={{
                      hidden: { y: '110%' },
                      show: { y: '0%', transition: { duration: 0.7, ease: EASE_OUT } },
                    }}
                    onClick={() => go(link.id)}
                    className={`flex w-full items-baseline gap-3 py-1.5 text-left font-editorial text-5xl font-normal leading-tight tracking-tight ${
                      active === link.id
                        ? 'text-emerald-400'
                        : onDark
                          ? 'text-white'
                          : 'text-night-900'
                    }`}
                  >
                    <span className="font-label text-[11px] text-ember-400/90">0{i + 1}</span>
                    {link.label}
                  </motion.button>
                </span>
              ))}
              <motion.button
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/connexion')}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-5 py-3 font-display text-sm font-bold tracking-wide text-white"
              >
                Espace SaaS <ArrowUpRight size={16} />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
