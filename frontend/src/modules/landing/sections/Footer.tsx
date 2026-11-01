import { useRef } from 'react';
import { motion, AnimatePresence, MotionValue, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { MessageCircle, Sun, Moon } from 'lucide-react';
import { AuroraBackground } from './AuroraBackground';

interface FooterProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const FOOTER_LINKS = [
  { label: 'Calculateur', href: '#calculateur' },
  { label: 'Espaces Entrepôts', href: '#entrepots' },
];

const columnVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

export function Footer({ isDark, onToggleTheme }: FooterProps) {
  function scrollTo(href: string) {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <footer
      className={`relative overflow-hidden border-t transition-colors duration-300 ${
        isDark ? 'bg-ink-950 border-white/10' : 'bg-white border-slate-200'
      }`}
    >
      <AuroraBackground isDark={isDark} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10"
        >
          <motion.div variants={columnVariants}>
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
              Fret aérien et maritime Chine → Guinée. Réception, groupage, dédouanement, facturation et
              livraison, centralisés dans une seule plateforme.
            </p>
          </motion.div>

          <motion.div variants={columnVariants}>
            <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-night-900'}`}>
              Liens rapides
            </p>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.label}>
                  <motion.button
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => scrollTo(link.href)}
                    className={`text-sm transition-colors ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-night-900'
                    }`}
                  >
                    {link.label}
                  </motion.button>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={columnVariants}>
            <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-night-900'}`}>
              Contact
            </p>
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
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
            </motion.a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-16 sm:pb-0 sm:pr-36 border-t ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            © {new Date().getFullYear()} DSL Air Cargo — Conakry, Guinée. Tous droits réservés.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleTheme}
            className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors overflow-hidden ${
              isDark
                ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
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
                {isDark ? <Sun size={13} /> : <Moon size={13} />}
              </motion.span>
            </AnimatePresence>
            Mode {isDark ? 'clair' : 'sombre'}
          </motion.button>
        </motion.div>

        {/* Signature de clôture : le nom de la marque en très grand. Les lettres proches du
            pointeur se soulèvent et s'illuminent en or, comme une vague qui suit la souris. */}
        <ProximityWordmark text="DSL Air Cargo" isDark={isDark} />
      </div>
    </footer>
  );
}

// Rayon d'influence du pointeur autour de chaque lettre, en pixels
const REACH = 240;

function ProximityWordmark({ text, isDark }: { text: string; isDark: boolean }) {
  // Position du pointeur (coordonnées écran) ; hors de la zone, on l'envoie très loin
  const px = useMotionValue(-9999);
  const py = useMotionValue(-9999);

  return (
    <div
      aria-hidden="true"
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        px.set(e.clientX);
        py.set(e.clientY);
      }}
      onPointerLeave={() => {
        px.set(-9999);
        py.set(-9999);
      }}
      className="mt-8 select-none overflow-hidden pt-12 text-center"
    >
      <motion.p
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-10%' }}
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className="font-editorial font-normal leading-none tracking-tight text-[clamp(3rem,14vw,13rem)]"
      >
        {Array.from(text).map((char, i) =>
          char === ' ' ? (
            <span key={i} className="inline-block w-[0.25em]" />
          ) : (
            <Letter key={i} char={char} px={px} py={py} isDark={isDark} />
          ),
        )}
      </motion.p>
    </div>
  );
}

function Letter({ char, px, py, isDark }: { char: string; px: MotionValue<number>; py: MotionValue<number>; isDark: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  // Influence de 0 (loin) à 1 (pointeur sur la lettre), lissée par un ressort
  const raw = useTransform([px, py], ([x, y]: number[]) => {
    const el = ref.current;
    if (!el || x < -9000) return 0;
    const r = el.getBoundingClientRect();
    const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
    return Math.max(0, 1 - d / REACH);
  });
  const influence = useSpring(raw, { stiffness: 260, damping: 22, mass: 0.5 });
  const y = useTransform(influence, [0, 1], ['0%', '-16%']);
  const scale = useTransform(influence, [0, 1], [1, 1.08]);
  const glow = useTransform(influence, (v) => Math.pow(v, 1.4));

  return (
    <motion.span
      variants={{
        hidden: { opacity: 0, y: 60, filter: 'blur(10px)' },
        show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
      }}
      className="inline-block"
    >
      <motion.span ref={ref} style={{ y, scale }} className="relative inline-block origin-bottom">
        <span className={isDark ? 'text-cream/[0.09]' : 'text-slate-900/[0.06]'}>{char}</span>
        {/* Copie dorée par-dessus, révélée par la proximité du pointeur */}
        <motion.span
          style={{ opacity: glow }}
          className="absolute inset-0 bg-gradient-to-b from-ember-300 via-ember-400 to-ember-500/40 bg-clip-text text-transparent [filter:drop-shadow(0_0_24px_rgba(245,158,11,0.35))]"
        >
          {char}
        </motion.span>
      </motion.span>
    </motion.span>
  );
}
