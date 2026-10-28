import { useState } from 'react';

// La landing page a son propre thème local (clair par défaut, bascule indépendante),
// distinct du thème global de l'application authentifiée (sombre par défaut, voir
// src/context/ThemeContext.tsx). On évite volontairement de piloter la classe `dark`
// globale ici pour ne pas changer le thème du reste de l'app depuis la page publique.
export function useLandingTheme() {
  // Sombre par défaut : la landing est pensée comme une salle de cinéma (voir tailwind.config.js, `ink`).
  const [isDark, setIsDark] = useState(true);
  return { isDark, toggle: () => setIsDark((v) => !v) };
}
