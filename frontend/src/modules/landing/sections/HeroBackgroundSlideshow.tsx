import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Diaporama de fond du Hero — fondu croisé automatique, toujours voilé par un dégradé
// sombre pour garder le texte parfaitement lisible par-dessus (WCAG-friendly).
const SLIDES = [
  '/images/backgrounds/avion-nez.jpg',
  '/images/backgrounds/grande-muraille.jpg',
  '/images/backgrounds/shanghai-skyline.jpg',
];

const INTERVAL_MS = 5500;

export function HeroBackgroundSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={SLIDES[index]}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.6, ease: 'easeInOut' }, scale: { duration: INTERVAL_MS / 1000, ease: 'linear' } }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${SLIDES[index]})` }}
        />
      </AnimatePresence>

      {/* Voile léger pour la lisibilité du texte, sans masquer les photos.
          Plus sombre en haut/bas (où vit le texte), quasi transparent au centre. */}
      <div className="absolute inset-0 bg-gradient-to-b from-night-950/55 via-night-950/25 to-night-900/80" />

      {/* Indicateurs de diapositive */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
        {SLIDES.map((slide, i) => (
          <span
            key={slide}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === index ? 'w-6 bg-white/80' : 'w-1.5 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
