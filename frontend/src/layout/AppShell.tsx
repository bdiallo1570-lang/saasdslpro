import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { MobileTopbar } from './MobileTopbar';
import { GlobalFab } from '@/components/GlobalFab';

interface AppShellProps {
  children: ReactNode;
}

// Coquille applicative commune à toutes les pages authentifiées : sidebar (desktop),
// topbar rétractable (mobile), et zone de contenu avec transition d'entrée.
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-night-900 flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileTopbar />
        <motion.main
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 px-4 sm:px-6 py-6 max-w-6xl w-full mx-auto"
        >
          {children}
        </motion.main>
      </div>
      <GlobalFab />
    </div>
  );
}
