import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

interface StatCounterProps {
  value: number;
  duration?: number;
  formatter?: (value: number) => string;
  className?: string;
}

// Compteur animé — anime de 0 (ou de l'ancienne valeur) vers `value` à chaque changement.
export function StatCounter({ value, duration = 1, formatter, className = '' }: StatCounterProps) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value, duration]);

  const formatted = formatter ? formatter(display) : Math.round(display).toLocaleString('fr-FR');

  return <span className={className}>{formatted}</span>;
}
