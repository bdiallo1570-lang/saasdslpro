import { useEffect, useRef, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { useLandingTheme } from '@/modules/landing/landingTheme';
import { Navbar } from '@/modules/landing/sections/Navbar';
import { SectionRail } from '@/modules/landing/sections/SectionRail';
import { CinematicIntro, shouldPlayIntro } from '@/modules/landing/sections/CinematicIntro';
import { ScrollMarquee } from '@/modules/landing/sections/ScrollMarquee';
import { startSmoothScroll, setScrollLocked, scrollToId } from '@/lib/smoothScroll';
import { VideoScrollStory } from '@/modules/landing/sections/VideoScrollStory';
import { PriceCalculator } from '@/modules/landing/sections/PriceCalculator';
import { Testimonials } from '@/modules/landing/sections/Testimonials';
import { WarehousesSection } from '@/modules/landing/sections/WarehousesSection';
import { ForbiddenItems } from '@/modules/landing/sections/ForbiddenItems';
import { FAQ } from '@/modules/landing/sections/FAQ';
import { Footer } from '@/modules/landing/sections/Footer';
import { ChatAssistant } from '@/modules/landing/assistant/ChatAssistant';
import { WhatsAppFab } from '@/modules/landing/assistant/WhatsAppFab';

export default function HomePage() {
  const { isDark, toggle } = useLandingTheme();
  const calculatorRef = useRef<HTMLDivElement>(null);
  // L'ouverture animée ne se joue qu'une fois par session (voir CinematicIntro) ; sinon, la page
  // est immédiatement prête. `heroReady` se déclenche dès que le rideau commence à s'ouvrir.
  const [introPlaying, setIntroPlaying] = useState(shouldPlayIntro);
  const [heroReady, setHeroReady] = useState(!introPlaying);

  useEffect(() => startSmoothScroll(), []);
  useEffect(() => {
    if (!introPlaying) return;
    setScrollLocked(true);
    return () => setScrollLocked(false);
  }, [introPlaying]);

  function scrollToCalculator() {
    scrollToId('calculateur');
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`min-h-screen transition-colors duration-300 ${
          isDark ? 'bg-ink-950' : 'bg-white'
        }`}
      >
        {introPlaying && (
          <CinematicIntro onOpen={() => setHeroReady(true)} onDone={() => setIntroPlaying(false)} />
        )}
        <Navbar isDark={isDark} onToggleTheme={toggle} ready={heroReady} />
        <VideoScrollStory onSimulateClick={scrollToCalculator} ready={heroReady} />
        <SectionRail isDark={isDark} />

        {/* Le reste de la page glisse par-dessus la vidéo comme une feuille : la sortie de la
            vidéo devient un geste, pas une coupure. */}
        <div
          className={`relative z-10 -mt-10 overflow-hidden rounded-t-[2.5rem] shadow-[0_-24px_60px_-24px_rgba(0,0,0,0.5)] transition-colors duration-300 ${
            isDark ? 'border-t border-white/10 bg-ink-950' : 'bg-white'
          }`}
        >
          <ScrollMarquee isDark={isDark} />
          <PriceCalculator isDark={isDark} ref={calculatorRef} />
          <Testimonials isDark={isDark} />
          <WarehousesSection isDark={isDark} />
          <ForbiddenItems isDark={isDark} />
          <FAQ isDark={isDark} />
          <Footer isDark={isDark} onToggleTheme={toggle} />
        </div>

        <ChatAssistant isDark={isDark} />
        <WhatsAppFab />
      </div>
    </MotionConfig>
  );
}
