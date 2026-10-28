interface AuroraBackgroundProps {
  isDark: boolean;
}

// Décor de section volontairement sobre : un seul halo très doux en haut de la section et un
// filet qui s'estompe sur les côtés. Purement décoratif (pointer-events: none), placé en
// absolute derrière le contenu. Remplace l'ancien fond « aurora » (trois taches animées) qui
// chargeait les sections sans rien dire.
export function AuroraBackground({ isDark }: AuroraBackgroundProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${
          isDark ? 'via-white/15' : 'via-slate-300'
        }`}
      />
      <div
        className={`absolute left-1/2 top-0 h-72 w-[min(70rem,100%)] -translate-x-1/2 rounded-full blur-3xl ${
          isDark ? 'bg-ember-400/[0.08]' : 'bg-emerald-300/[0.16]'
        }`}
        style={{ transform: 'translate(-50%, -60%)' }}
      />
    </div>
  );
}
