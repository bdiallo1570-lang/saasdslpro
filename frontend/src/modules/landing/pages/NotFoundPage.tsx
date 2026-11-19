import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, LayoutDashboard, LogIn, MessageCircle, Moon, Sun } from 'lucide-react';
import { useLandingTheme } from '@/modules/landing/landingTheme';
import { usePageMeta } from '@/lib/pageMeta';
import { useAuth } from '@/context/AuthContext';
import { ROLE_DASHBOARD_ROUTE } from '@/lib/roles';
import { WHATSAPP_LIEN } from '../legal/legalInfo';

// Page 404 : adresse inconnue. Remplace l'ancien renvoi silencieux vers l'accueil, qui laissait
// croire au visiteur que son lien marchait. Exclue des moteurs de recherche : sur un site sans
// rendu serveur, Vercel répond toujours « 200 », la balise noindex évite d'indexer ces pages.
export default function NotFoundPage() {
  usePageMeta({ titre: 'Page introuvable', indexable: false });
  const { isDark, toggle } = useLandingTheme();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const reduit = useReducedMotion();
  const espace = user ? ROLE_DASHBOARD_ROUTE[user.role] : null;

  const t = {
    page: isDark ? 'bg-ink-950 text-slate-300' : 'bg-white text-slate-600',
    titre: isDark ? 'text-cream' : 'text-night-900',
    doux: isDark ? 'text-slate-400' : 'text-slate-600',
    bord: isDark ? 'border-white/10' : 'border-slate-200',
    survol: isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100',
    accent: isDark ? 'text-ember-400' : 'text-cargo-700',
  };

  return (
    <div className={`relative flex min-h-screen flex-col overflow-hidden transition-colors duration-300 ${t.page}`}>
      <header className={`border-b ${t.bord}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/images/backgrounds/dsl-logo-96.webp" alt="" className="h-8 w-8 rounded-full object-cover" />
            <span className={`font-semibold ${t.titre}`}>DSL Air Cargo</span>
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            className={`rounded-full border p-2 transition-colors ${t.bord} ${t.survol}`}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        {/* Route Guangzhou → Conakry en pointillés : l'avion quitte la trajectoire (décor) */}
        <svg viewBox="0 0 400 120" className="mb-6 w-full max-w-md" aria-hidden="true">
          <path
            d="M20 90 C 120 20, 240 20, 380 70"
            fill="none"
            stroke="currentColor"
            strokeOpacity={isDark ? 0.25 : 0.2}
            strokeWidth="2"
            strokeDasharray="4 8"
          />
          <circle cx="20" cy="90" r="5" className={t.accent} fill="currentColor" />
          <circle cx="380" cy="70" r="5" className={t.accent} fill="currentColor" fillOpacity={0.35} />
          <text x="20" y="112" textAnchor="start" fontSize="11" fill="currentColor" fillOpacity={0.6}>
            Guangzhou
          </text>
          <text x="380" y="92" textAnchor="end" fontSize="11" fill="currentColor" fillOpacity={0.6}>
            Conakry
          </text>
          <motion.g
            initial={reduit ? false : { x: 150, y: 28, rotate: 0 }}
            animate={reduit ? undefined : { x: [150, 215, 262], y: [28, 6, -14], rotate: [0, -14, -28] }}
            transition={{ duration: 3.2, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse', repeatDelay: 0.6 }}
            style={reduit ? { transform: 'translate(215px, 6px)' } : undefined}
          >
            <path d="M0 0 L22 6 L0 12 L5 6 Z" className={t.accent} fill="currentColor" />
          </motion.g>
        </svg>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <p className={`font-label text-xs uppercase tracking-[0.3em] ${t.accent}`}>Erreur 404</p>
          <h1 className={`mt-3 font-editorial text-5xl leading-tight sm:text-7xl ${t.titre}`}>Page introuvable</h1>
          <p className={`mx-auto mt-4 max-w-md text-base sm:text-lg ${t.doux}`}>
            Ce colis-là n’est jamais arrivé : l’adresse demandée n’existe pas, ou plus.
          </p>
          <p
            className={`mx-auto mt-3 max-w-xs truncate rounded-lg border px-3 py-1.5 font-label text-xs sm:max-w-md ${t.bord} ${t.doux}`}
            title={pathname}
          >
            {pathname}
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cargo-500 px-6 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-cargo-400"
            >
              <ArrowLeft size={16} /> Retour à l’accueil
            </Link>
            <Link
              to={espace ?? '/connexion'}
              className={`inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-colors ${t.bord} ${t.survol} ${t.titre}`}
            >
              {espace ? <LayoutDashboard size={16} /> : <LogIn size={16} />}
              {espace ? 'Mon espace' : 'Se connecter'}
            </Link>
          </div>

          <p className={`mt-8 text-sm ${t.doux}`}>
            Un lien reçu de notre part ne fonctionne pas ?{' '}
            <a
              href={WHATSAPP_LIEN}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 py-1 font-medium underline-offset-2 hover:underline ${t.accent}`}
            >
              <MessageCircle size={14} /> Écrivez-nous sur WhatsApp
            </a>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
