import { SectionHeading } from '../sections/SectionHeading';
import { SeaRouteScene } from './SeaRouteScene';
import { AirVsSea } from './AirVsSea';
import { CbmCalculator } from './CbmCalculator';

// Fret maritime : la traversée épinglée au défilement (toujours sombre, comme la vidéo
// d'accueil), puis le comparatif avion/bateau et le calculateur de volume, au thème de la page.
export function MaritimeSection({ isDark }: { isDark: boolean }) {
  return (
    <section aria-label="Fret maritime">
      <SeaRouteScene />
      <div id="comparatif-maritime" className={`relative py-20 sm:py-28 transition-colors duration-300 ${isDark ? 'bg-ink-950' : 'bg-white'}`}>
        <div className="mx-auto max-w-5xl space-y-16 px-4 sm:px-6">
          <SectionHeading
            isDark={isDark}
            eyebrow="Avion ou bateau ?"
            title="Le bon mode pour chaque envoi"
            description="L’avion pour la vitesse, le bateau pour le volume. Même équipe, même suivi."
          />
          <AirVsSea isDark={isDark} />
          <CbmCalculator isDark={isDark} />
        </div>
      </div>
    </section>
  );
}
