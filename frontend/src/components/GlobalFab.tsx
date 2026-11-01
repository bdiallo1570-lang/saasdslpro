import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_NAMES } from '@/lib/roles';
import { NouveauColisForm } from '@/modules/colis/components/NouveauColisForm';
import { Modal } from '@/ui';
import { onNewColisOpen } from '@/layout/commandEvents';

// Visible sur toutes les pages de l'espace agent (monté dans AppShell). N'ouvre le formulaire
// de création que pour les rôles ayant colis:write (Admin, Agent Chine) — pour les autres
// (Agent Guinée), reste visible mais affiche un message explicite plutôt que de disparaître,
// pour garder une expérience cohérente "le bouton est toujours là".
export function GlobalFab() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Ouvrable aussi depuis la palette de commandes (⌘K → « Enregistrer un nouveau colis »)
  useEffect(() => onNewColisOpen(() => setOpen(true)), []);

  if (!user || user.role === ROLE_NAMES.CLIENT) return null;

  const canCreateColis = user.role === ROLE_NAMES.ADMIN || user.role === ROLE_NAMES.AGENT_CHINE;

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className="group fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 overflow-hidden rounded-full bg-cargo-500 hover:bg-cargo-400 text-ink-950 font-semibold px-5 py-3.5 shadow-glow-cargo transition-colors"
        aria-label="Nouveau colis"
      >
        {/* Reflet qui balaie le bouton au survol */}
        <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/30 blur-md transition-transform duration-700 group-hover:translate-x-[420%]" />
        <Plus size={20} className="transition-transform duration-300 group-hover:rotate-90" />
        <span className="hidden sm:inline">Nouveau Colis</span>
      </motion.button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau colis" maxWidthClassName="max-w-md">
        {canCreateColis ? (
          <NouveauColisForm onCreated={() => setOpen(false)} />
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            La réception de colis est réservée à l'Agent Chine (et à l'Admin). Contactez l'agent
            Chine pour enregistrer ce colis.
          </p>
        )}
      </Modal>
    </>
  );
}
