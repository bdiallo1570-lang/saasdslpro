import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { MobileTopbar } from './MobileTopbar';
import { CommandPalette } from './CommandPalette';
import { ChangePasswordModal } from './ChangePasswordModal';
import { GlobalFab } from '@/components/GlobalFab';

interface AppShellProps {
  children: ReactNode;
}

// Coquille applicative commune à toutes les pages authentifiées : sidebar (desktop),
// topbar rétractable (mobile), palette de commandes (⌘K) et zone de contenu avec transition
// d'entrée.
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-night-900 flex">
      {/* Lumière d'ambiance très douce derrière le contenu (fixe, ne défile pas) */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-sky-400/[0.07] blur-3xl dark:bg-sky-500/[0.08]" />
        <div className="absolute bottom-[-20%] left-[15%] h-[480px] w-[480px] rounded-full bg-cargo-400/[0.06] blur-3xl dark:bg-cargo-500/[0.05]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      </div>

      <Sidebar />
      <div className="relative flex-1 min-w-0 flex flex-col">
        <MobileTopbar />
        {/* Le flou est retiré à la fin (`filter: none`) : un filtre résiduel ferait des pages un
            bloc conteneur pour les fenêtres modales en position fixe. */}
        <motion.main
          initial={{ opacity: 0, y: 22, scale: 0.975, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: '50% 0%' }}
          className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-7xl w-full mx-auto"
        >
          {children}
        </motion.main>
      </div>
      <GlobalFab />
      <CommandPalette />
      <ChangePasswordModal />
    </div>
  );
}
