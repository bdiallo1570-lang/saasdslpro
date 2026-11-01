import { HTMLAttributes, ReactNode, useRef } from 'react';

interface SpotlightProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  // Couleur du halo (rgba conseillé, faible opacité)
  color?: string;
  size?: number;
}

// Halo lumineux qui suit le pointeur à l'intérieur de l'élément. Position écrite dans des
// variables CSS (aucun re-rendu React à chaque mouvement) ; souris uniquement, invisible au doigt.
export function Spotlight({
  children,
  color = 'rgba(16,185,129,0.14)',
  size = 380,
  className = '',
  ...props
}: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        ref.current.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
        ref.current.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
      }}
      className={`group/spot relative isolate ${className}`}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background: `radial-gradient(${size}px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${color}, transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
}
