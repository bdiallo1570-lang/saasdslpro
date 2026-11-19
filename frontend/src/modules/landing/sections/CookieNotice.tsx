import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

// Bandeau d'information sur les cookies (et non de consentement) : le site n'utilise aucun
// cookie publicitaire ni de suivi, et sa mesure d'audience (Vercel Analytics) fonctionne sans
// cookie ni identifiant : il n'y a donc rien à accepter ou refuser. Seul le fait de l'avoir
// fermé est retenu sur l'appareil. Si un outil qui dépose des cookies est ajouté un jour
// (Google Analytics, pixel Facebook…), il faudra le remplacer par un vrai choix
// Accepter / Refuser, AVANT de charger l'outil.

const CLE = 'dsl_info_cookies_vu';

function dejaVu(): boolean {
  try {
    return localStorage.getItem(CLE) === '1';
  } catch {
    return false;
  }
}

interface CookieNoticeProps {
  isDark: boolean;
  // false pendant l'ouverture animée de l'accueil : le bandeau attend la fin
  actif?: boolean;
  // true sur l'accueil : sur mobile, le bandeau se place au-dessus des boutons WhatsApp et assistant
  boutonsFlottants?: boolean;
}

export function CookieNotice({ isDark, actif = true, boutonsFlottants = false }: CookieNoticeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!actif || dejaVu()) return;
    // Petit délai : la page s'affiche d'abord, le bandeau arrive ensuite sans masquer l'essentiel
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, [actif]);

  function fermer() {
    setVisible(false);
    try {
      localStorage.setItem(CLE, '1');
    } catch {
      /* stockage indisponible : le bandeau reviendra à la prochaine visite, sans conséquence */
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="region"
          aria-label="Information sur les cookies"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          // Ordinateur : en bas à gauche, à l'écart des boutons flottants (en bas à droite)
          className={`fixed inset-x-4 ${boutonsFlottants ? 'bottom-24' : 'bottom-4'} z-[60] rounded-2xl border p-4 shadow-2xl backdrop-blur-md sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-sm ${
            isDark ? 'border-white/10 bg-ink-950/90 text-slate-300' : 'border-slate-200 bg-white/95 text-slate-600'
          }`}
        >
          <p className={`flex items-center gap-2 text-sm font-semibold ${isDark ? 'text-cream' : 'text-night-900'}`}>
            <ShieldCheck size={16} className="shrink-0 text-ember-500" />
            Pas de cookies de suivi ici
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed">
            Ce site n’utilise aucun cookie publicitaire ni de suivi : seulement ce qu’il faut pour vous garder
            connecté et retenir le mode clair ou sombre. La fréquentation est mesurée de façon anonyme, sans cookie.
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Link
              to="/confidentialite"
              className={`text-[13px] underline-offset-2 transition-colors hover:underline ${
                isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-night-800'
              }`}
            >
              En savoir plus
            </Link>
            <motion.button
              type="button"
              onClick={fermer}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-lg bg-ember-500 px-3.5 py-1.5 text-[13px] font-semibold text-ink-950 transition-colors hover:bg-ember-400"
            >
              J’ai compris
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
