import { useRef } from 'react';
import { useLandingTheme } from '@/modules/landing/landingTheme';
import { Navbar } from '@/modules/landing/sections/Navbar';
import { Hero } from '@/modules/landing/sections/Hero';
import { PriceCalculator } from '@/modules/landing/sections/PriceCalculator';
import { Testimonials } from '@/modules/landing/sections/Testimonials';
import { WarehousesSection } from '@/modules/landing/sections/WarehousesSection';
import { ForbiddenItems } from '@/modules/landing/sections/ForbiddenItems';
import { FAQ } from '@/modules/landing/sections/FAQ';
import { Footer } from '@/modules/landing/sections/Footer';
import { ChatAssistant } from '@/modules/landing/assistant/ChatAssistant';

export default function HomePage() {
  const { isDark, toggle } = useLandingTheme();
  const calculatorRef = useRef<HTMLDivElement>(null);

  function scrollToCalculator() {
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div
      className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${
        isDark ? 'bg-night-900' : 'bg-white'
      }`}
    >
      <Navbar isDark={isDark} onToggleTheme={toggle} />
      <Hero onSimulateClick={scrollToCalculator} />
      <PriceCalculator isDark={isDark} ref={calculatorRef} />
      <Testimonials isDark={isDark} />
      <WarehousesSection isDark={isDark} />
      <ForbiddenItems isDark={isDark} />
      <FAQ isDark={isDark} />
      <Footer isDark={isDark} onToggleTheme={toggle} />
      <ChatAssistant isDark={isDark} />
    </div>
  );
}
