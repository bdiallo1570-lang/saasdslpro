import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { Search, CornerDownLeft, Plus, SunMoon, LogOut, Globe, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ROLE_NAMES } from '@/lib/roles';
import { NAV_ITEMS, NavItem } from './navConfig';
import { NavIcon } from './NavIcon';
import { onCommandPaletteOpen, openNewColis } from './commandEvents';

interface Command {
  id: string;
  label: string;
  section: 'Aller à' | 'Actions';
  hint?: string;
  keywords?: string[];
  icon: React.ReactNode;
  run: () => void;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Palette de commandes (⌘K / Ctrl+K, ou « / ») : on tape quelques lettres, on va n'importe où
// ou on lance une action, sans chercher dans les menus. Recherche approximative (fautes de
// frappe tolérées) limitée aux pages autorisées pour le rôle connecté.
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => onCommandPaletteOpen(() => setOpen(true)), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    if (!user) return [];
    const close = (fn: () => void) => () => {
      setOpen(false);
      fn();
    };
    const pages = NAV_ITEMS.filter((item: NavItem) => item.roles.includes(user.role)).map<Command>((item) => ({
      id: item.to,
      label: item.label,
      section: 'Aller à',
      hint: item.group,
      keywords: item.keywords,
      icon: <NavIcon icon={item.icon} className="h-4 w-4" />,
      run: close(() => navigate(item.to)),
    }));
    const actions: Command[] = [];
    if (user.role === ROLE_NAMES.ADMIN || user.role === ROLE_NAMES.AGENT_CHINE) {
      actions.push({
        id: 'new-colis',
        label: 'Enregistrer un nouveau colis',
        section: 'Actions',
        keywords: ['ajouter', 'créer', 'réception', 'colis'],
        icon: <Plus className="h-4 w-4" />,
        run: close(openNewColis),
      });
    }
    actions.push(
      {
        id: 'theme',
        label: theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre',
        section: 'Actions',
        keywords: ['thème', 'couleur', 'nuit', 'jour'],
        icon: <SunMoon className="h-4 w-4" />,
        run: close(toggleTheme),
      },
      {
        id: 'site',
        label: 'Ouvrir le site public',
        section: 'Actions',
        keywords: ['landing', 'accueil', 'vitrine', 'maritime'],
        icon: <Globe className="h-4 w-4" />,
        run: close(() => navigate('/')),
      },
      {
        id: 'logout',
        label: 'Se déconnecter',
        section: 'Actions',
        keywords: ['quitter', 'sortir'],
        icon: <LogOut className="h-4 w-4" />,
        run: close(async () => {
          await logout();
          navigate('/connexion');
        }),
      },
    );
    return [...pages, ...actions];
  }, [user, theme, navigate, toggleTheme, logout]);

  const fuse = useMemo(
    () => new Fuse(commands, { keys: ['label', 'keywords', 'hint'], threshold: 0.4, ignoreLocation: true }),
    [commands],
  );
  const results = query.trim() ? fuse.search(query.trim()).map((r) => r.item) : commands;

  useEffect(() => setIndex(0), [query]);

  // Garde la ligne active visible quand on navigue au clavier
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      results[index]?.run();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-night-950/50 px-4 pt-[12vh] backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Palette de commandes"
            initial={{ opacity: 0, y: -16, scale: 0.97, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, scale: 0.98, filter: 'blur(4px)' }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-night-950/30 backdrop-blur-xl dark:border-night-600 dark:bg-night-800/95"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-night-700">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Rechercher une page ou une action…"
                className="h-14 flex-1 bg-transparent text-[15px] text-night-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
              <kbd className="rounded-md border border-slate-200 px-1.5 py-0.5 font-label text-[10px] text-slate-400 dark:border-night-600">
                Échap
              </kbd>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <p className="px-3 py-10 text-center text-sm text-slate-400">
                  Aucun résultat pour « {query} »
                </p>
              )}
              {results.map((cmd, i) => {
                const showSection = i === 0 || cmd.section !== results[i - 1].section;
                const active = i === index;
                return (
                  <div key={cmd.id}>
                    {showSection && (
                      <p className="px-3 pb-1 pt-3 font-label text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        {cmd.section}
                      </p>
                    )}
                    <button
                      type="button"
                      data-index={i}
                      onMouseMove={() => setIndex(i)}
                      onClick={cmd.run}
                      className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                        active ? 'text-night-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="command-active"
                          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                          className="absolute inset-0 rounded-xl bg-slate-100 dark:bg-night-700"
                        />
                      )}
                      <span
                        className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          active
                            ? 'border-sky-400/40 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                            : 'border-slate-200 text-slate-500 dark:border-night-600 dark:text-slate-400'
                        }`}
                      >
                        {cmd.icon}
                      </span>
                      <span className="relative flex-1 truncate font-medium">{cmd.label}</span>
                      {cmd.hint && (
                        <span className="relative text-xs text-slate-500 dark:text-slate-400">{cmd.hint}</span>
                      )}
                      <span className={`relative transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}>
                        {cmd.section === 'Aller à' ? (
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                        ) : (
                          <CornerDownLeft className="h-4 w-4 text-slate-400" />
                        )}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-400 dark:border-night-700">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> naviguer
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd> ouvrir
              </span>
              <span className="ml-auto">DSL Air Cargo</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-slate-200 px-1 font-label text-[10px] dark:border-night-600">
      {children}
    </kbd>
  );
}
