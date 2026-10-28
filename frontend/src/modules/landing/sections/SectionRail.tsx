import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { scrollToId } from '@/lib/smoothScroll';

const SECTIONS = [
  { id: 'suivi', label: 'Accueil' },
  { id: 'calculateur', label: 'Tarifs' },
  { id: 'avis', label: 'Avis' },
  { id: 'entrepots', label: 'Entrepôts' },
  { id: 'produits-interdits', label: 'À savoir' },
  { id: 'faq', label: 'FAQ' },
];

interface SectionRailProps {
  isDark: boolean;
}

// « Ligne de vol » : un trait très fin sur le bord droit, tracé au fil du défilement, avec une
// pointe lumineuse ambre. Chaque section y est un point, placé à sa vraie position dans la page ;
// il « s'allume » quand on l'atteint. Remplace la barre de progression et les points séparés.
// (Inspiré de la tige tracée au scroll de theseed.volm.studio.)
export function SectionRail({ isDark }: SectionRailProps) {
  const [active, setActive] = useState(SECTIONS[0].id);
  const [positions, setPositions] = useState<number[]>(() => SECTIONS.map((_, i) => i / (SECTIONS.length - 1)));

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.3 });
  const tipTop = useTransform(progress, (v) => `${v * 100}%`);

  // Position de chaque section sur la ligne = sa position réelle dans la page (0 → 1)
  useEffect(() => {
    const measure = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setPositions(
        SECTIONS.map(({ id }) => {
          const el = document.getElementById(id);
          if (!el) return 0;
          const top = el.getBoundingClientRect().top + window.scrollY;
          return Math.min(1, Math.max(0, top / max));
        }),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener('load', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('load', measure);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      // Une section est « active » quand elle traverse la ligne médiane de l'écran
      { rootMargin: '-50% 0px -50% 0px' },
    );
    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const light = isDark || active === 'suivi';
  const track = light ? 'bg-white/15' : 'bg-slate-300';
  const stroke = light ? 'bg-cream' : 'bg-night-900';
  const reached = SECTIONS.findIndex((s) => s.id === active);

  return (
    <nav
      aria-label="Sections de la page"
      className="pointer-events-none fixed right-6 top-1/2 z-30 hidden h-[58vh] w-24 -translate-y-1/2 xl:block"
    >
      <div className="absolute right-[3px] top-0 h-full w-px">
        <div className={`absolute inset-0 ${track}`} />
        <motion.div style={{ scaleY: progress }} className={`absolute inset-0 origin-top ${stroke}`} />
        {/* Pointe lumineuse */}
        <motion.span
          aria-hidden="true"
          style={{ top: tipTop }}
          className="absolute left-1/2 block h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-300 shadow-[0_0_14px_5px_rgba(255,179,92,0.55)]"
        />
      </div>

      {SECTIONS.map(({ id, label }, i) => {
        const isActive = id === active;
        const lit = i <= reached;
        return (
          <button
            key={id}
            type="button"
            onClick={() => scrollToId(id)}
            aria-label={label}
            aria-current={isActive ? 'true' : undefined}
            style={{ top: `${positions[i] * 100}%` }}
            className="group pointer-events-auto absolute right-0 flex -translate-y-1/2 items-center gap-3"
          >
            <span
              className={`font-label text-[10px] uppercase tracking-[0.25em] transition-all duration-500 ${
                isActive ? 'translate-x-0 opacity-100' : 'translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
              } ${light ? 'text-cream' : 'text-night-900'}`}
            >
              {label}
            </span>
            <span
              className={`block h-[7px] w-[7px] rounded-full border transition-all duration-500 ${
                lit
                  ? `scale-100 ${light ? 'border-cream bg-cream' : 'border-night-900 bg-night-900'}`
                  : `scale-90 ${light ? 'border-white/40 bg-ink-950' : 'border-slate-400 bg-white'}`
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
