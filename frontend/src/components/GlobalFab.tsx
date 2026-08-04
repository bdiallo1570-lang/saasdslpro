import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_NAMES } from '@/lib/roles';
import { NouveauColisForm } from '@/modules/colis/components/NouveauColisForm';
import { Modal } from '@/ui';

// Visible sur toutes les pages de l'espace agent (monté dans AppShell). N'ouvre le formulaire
// de création que pour les rôles ayant colis:write (Admin, Agent Chine) — pour les autres
// (Agent Guinée), reste visible mais affiche un message explicite plutôt que de disparaître,
// pour garder une expérience cohérente "le bouton est toujours là".
export function GlobalFab() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user || user.role === ROLE_NAMES.CLIENT) return null;

  const canCreateColis = user.role === ROLE_NAMES.ADMIN || user.role === ROLE_NAMES.AGENT_CHINE;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-cargo-500 hover:bg-cargo-400 text-white font-semibold px-5 py-3.5 shadow-glow-cargo transition-colors"
        aria-label="Nouveau colis"
      >
        <Plus size={20} />
        <span className="hidden sm:inline">Nouveau Colis</span>
      </button>

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
