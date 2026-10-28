import Lenis from 'lenis';

// Défilement à inertie de la landing (Lenis) : la molette glisse au lieu de sauter, ce qui donne
// le rendu « cinéma » de la page et adoucit aussi la lecture de la vidéo au scroll. Désactivé
// pour les visiteurs qui demandent moins d'animations ; sur écran tactile, le défilement natif
// est conservé (Lenis ne lisse que la molette par défaut).
let instance: Lenis | null = null;

export function startSmoothScroll(): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  instance = lenis;
  let raf = 0;
  const loop = (time: number) => {
    lenis.raf(time);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    lenis.destroy();
    instance = null;
  };
}

// Fige / reprend le défilement (pendant l'ouverture animée, par exemple).
export function setScrollLocked(locked: boolean) {
  if (locked) instance?.stop();
  else instance?.start();
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}

// Défile jusqu'à une section par son id, sous la barre de menu (72 px), avec inertie si active.
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (instance) instance.scrollTo(el, { offset: id === 'suivi' ? 0 : -72, duration: 1.6 });
  else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
