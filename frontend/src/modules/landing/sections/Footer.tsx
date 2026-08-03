import { MessageCircle, Sun, Moon } from 'lucide-react';
import { AuroraBackground } from './AuroraBackground';
import { CursorSpotlight } from './CursorSpotlight';

interface FooterProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const FOOTER_LINKS = [
  { label: 'Calculateur', href: '#calculateur' },
  { label: 'Suivi de Colis', href: '#suivi' },
  { label: 'Espaces Entrepôts', href: '#entrepots' },
];

export function Footer({ isDark, onToggleTheme }: FooterProps) {
  function scrollTo(href: string) {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <footer
      className={`relative overflow-hidden border-t transition-colors duration-300 ${
        isDark ? 'bg-night-900 border-white/10' : 'bg-white border-slate-200'
      }`}
    >
      <AuroraBackground isDark={isDark} />
      <CursorSpotlight isDark={isDark} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <img
                src="/images/backgrounds/dsl-logo-200.png"
                alt="DSL Air Cargo"
                className="h-9 w-9 rounded-full object-cover"
              />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-night-900'}`}>
                DSL Air Cargo
              </span>
            </div>
            <p className={`text-sm max-w-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Fret aérien Chine → Guinée. Réception, groupage, dédouanement, facturation et
              livraison, centralisés dans une seule plateforme.
            </p>
          </div>

          <div>
            <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-night-900'}`}>
              Liens rapides
            </p>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollTo(link.href)}
                    className={`text-sm transition-colors ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-night-900'
                    }`}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-night-900'}`}>
              Contact
            </p>
            <a
              href="https://wa.me/224628674895"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <MessageCircle size={16} />
              Nous écrire sur WhatsApp
            </a>
          </div>
        </div>

        <div
          className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            © {new Date().getFullYear()} DSL Air Cargo — Conakry, Guinée. Tous droits réservés.
          </p>

          <button
            onClick={onToggleTheme}
            className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              isDark
                ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
            Mode {isDark ? 'clair' : 'sombre'}
          </button>
        </div>
      </div>
    </footer>
  );
}
