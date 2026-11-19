import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, LucideIcon, MessageCircle, Moon, Sun } from 'lucide-react';
import { useLandingTheme } from '@/modules/landing/landingTheme';
import { CookieNotice } from '@/modules/landing/sections/CookieNotice';
import { LegalSection, WHATSAPP, WHATSAPP_LIEN } from './legalInfo';
import { usePageMeta } from '@/lib/pageMeta';

// Mise en page commune des pages légales (confidentialité, conditions générales) : en-tête,
// points clés, sommaire qui suit la lecture, sections numérotées, contact WhatsApp.

// Liste à puces des pages légales
export function Liste({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

interface LegalLayoutProps {
  surtitre: string;
  Icone: LucideIcon;
  titre: string;
  intro: string;
  // Description meta (moteurs de recherche), environ 150 caractères
  description: string;
  miseAJour: string;
  enBref: string[];
  sections: LegalSection[];
  // Titre de l'encadré de contact en bas de page
  question: string;
  // Lien vers l'autre page légale, en pied de page
  autrePage: { to: string; label: string };
}

export function LegalLayout({
  surtitre,
  Icone,
  titre,
  intro,
  description,
  miseAJour,
  enBref,
  sections,
  question,
  autrePage,
}: LegalLayoutProps) {
  const { isDark, toggle } = useLandingTheme();
  const [active, setActive] = useState(sections[0].id);

  usePageMeta({ titre, description });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [titre]);

  // Surligne dans le sommaire la section en cours de lecture
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibles = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visibles[0]) setActive(visibles[0].target.id);
        // Retour en haut de page : aucune section dans la zone de lecture, on revient à la première
        else if (window.scrollY < 300) setActive(sections[0].id);
      },
      { rootMargin: '-20% 0px -65% 0px' },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const t = {
    page: isDark ? 'bg-ink-950 text-slate-300' : 'bg-white text-slate-600',
    titre: isDark ? 'text-cream' : 'text-night-900',
    doux: isDark ? 'text-slate-400' : 'text-slate-500',
    bord: isDark ? 'border-white/10' : 'border-slate-200',
    carte: isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200',
    survol: isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100',
    // Accent : orange sur fond sombre, cuivre plus foncé sur fond clair (contraste ≥ 4,5:1)
    accent: isDark ? 'text-ember-500' : 'text-cargo-700',
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${t.page}`}>
      <header
        className={`sticky top-0 z-20 border-b backdrop-blur ${t.bord} ${isDark ? 'bg-ink-950/80' : 'bg-white/80'}`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/images/backgrounds/dsl-logo-96.webp" alt="" className="h-8 w-8 rounded-full object-cover" />
            <span className={`font-semibold ${t.titre}`}>DSL Air Cargo</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
              className={`rounded-full border p-2 transition-colors ${t.bord} ${t.survol}`}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link
              to="/"
              className={`group hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors sm:inline-flex ${t.bord} ${t.survol}`}
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
              Accueil
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className={`inline-flex items-center gap-2 text-sm font-medium ${t.accent}`}>
            <Icone size={16} /> {surtitre}
          </p>
          <h1 className={`mt-3 font-editorial text-4xl leading-tight sm:text-6xl ${t.titre}`}>{titre}</h1>
          <p className={`mt-4 max-w-2xl text-base sm:text-lg ${t.doux}`}>{intro}</p>
          <p className={`mt-3 text-sm ${t.doux}`}>Dernière mise à jour : {miseAJour}</p>
        </motion.div>

        <motion.ul
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
          className="mt-10 grid gap-3 sm:grid-cols-3"
        >
          {enBref.map((point) => (
            <motion.li
              key={point}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              className={`rounded-2xl border p-4 text-sm leading-relaxed ${t.carte}`}
            >
              <Icone size={16} className={`mb-2 ${t.accent}`} />
              <span className={isDark ? 'text-slate-200' : 'text-night-800'}>{point}</span>
            </motion.li>
          ))}
        </motion.ul>

        <div className="mt-14 grid gap-12 lg:grid-cols-[230px_1fr]">
          <nav aria-label="Sommaire" className="hidden lg:block">
            <ol className={`sticky top-24 space-y-1 border-l text-sm ${t.bord}`}>
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`-ml-px block border-l-2 py-1.5 pl-4 transition-colors ${
                      active === s.id
                        ? `border-ember-500 ${t.titre}`
                        : `border-transparent ${t.doux} ${isDark ? 'hover:text-slate-200' : 'hover:text-night-800'}`
                    }`}
                  >
                    <span className="mr-2 tabular-nums opacity-60">{String(i + 1).padStart(2, '0')}</span>
                    {s.titre}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="max-w-2xl space-y-12 text-[15px] leading-relaxed">
            {sections.map((s, i) => (
              <motion.section
                key={s.id}
                id={s.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="scroll-mt-24"
              >
                <h2 className={`flex items-baseline gap-3 text-xl font-semibold sm:text-2xl ${t.titre}`}>
                  <span className={`text-sm font-medium tabular-nums ${t.accent}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {s.titre}
                </h2>
                <div
                  className={`mt-3 ${isDark ? '[&_strong]:text-slate-100' : '[&_strong]:text-night-900'} [&_strong]:font-semibold ${isDark ? '[&_a]:text-ember-400' : '[&_a]:text-cargo-700'}`}
                >
                  {s.contenu}
                </div>
              </motion.section>
            ))}

            <div className={`rounded-2xl border p-5 ${t.carte}`}>
              <p className={`font-semibold ${t.titre}`}>{question}</p>
              <p className={`mt-1 text-sm ${t.doux}`}>Notre équipe vous répond sur WhatsApp.</p>
              <a
                href={WHATSAPP_LIEN}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  isDark
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <MessageCircle size={16} /> {WHATSAPP}
              </a>
            </div>
          </article>
        </div>
      </main>

      <footer className={`border-t py-6 text-center text-xs ${t.bord} ${t.doux}`}>
        © {new Date().getFullYear()} DSL Air Cargo, Conakry, Guinée ·{' '}
        <Link to={autrePage.to} className="inline-block py-1.5 underline-offset-2 hover:underline">
          {autrePage.label}
        </Link>{' '}
        ·{' '}
        <Link to="/" className="inline-block py-1.5 underline-offset-2 hover:underline">
          Retour à l’accueil
        </Link>
      </footer>
      <CookieNotice isDark={isDark} />
    </div>
  );
}
