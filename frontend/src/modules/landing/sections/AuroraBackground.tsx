interface AuroraBackgroundProps {
  isDark: boolean;
}

// Fond dynamique "aurora" — trois taches de couleur (émeraude/orange/bleu) qui dérivent
// lentement en boucle, façon dégradés animés. Purement décoratif (pointer-events: none),
// placé en absolute derrière le contenu de la section.
export function AuroraBackground({ isDark }: AuroraBackgroundProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className={`absolute -top-1/4 -left-1/4 h-[60%] w-[60%] rounded-full blur-3xl animate-aurora1 ${
          isDark ? 'bg-sky-500/25' : 'bg-sky-300/40'
        }`}
      />
      <div
        className={`absolute -bottom-1/4 -right-1/4 h-[65%] w-[65%] rounded-full blur-3xl animate-aurora2 ${
          isDark ? 'bg-cargo-500/20' : 'bg-cargo-300/35'
        }`}
      />
      <div
        className={`absolute top-1/3 right-1/4 h-[45%] w-[45%] rounded-full blur-3xl animate-aurora3 ${
          isDark ? 'bg-emerald-400/15' : 'bg-emerald-200/40'
        }`}
      />
    </div>
  );
}
