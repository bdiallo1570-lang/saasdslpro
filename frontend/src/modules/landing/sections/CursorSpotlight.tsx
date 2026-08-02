import { useRef } from 'react';

interface CursorSpotlightProps {
  isDark: boolean;
}

// Halo lumineux qui suit le pointeur de la souris à l'intérieur de la section parente
// (façon landing page Antigravity). La position est appliquée via des variables CSS
// mises à jour directement sur le DOM (pas de re-render React à chaque mouvement).
export function CursorSpotlight({ isDark }: CursorSpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.parentElement!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--x', `${x}%`);
    el.style.setProperty('--y', `${y}%`);
    el.style.opacity = '1';
  }

  function handleMouseLeave() {
    if (ref.current) ref.current.style.opacity = '0';
  }

  return (
    <div
      className="absolute inset-0 z-0"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={ref}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), ${
            isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.12)'
          }, transparent 70%)`,
        }}
      />
    </div>
  );
}
