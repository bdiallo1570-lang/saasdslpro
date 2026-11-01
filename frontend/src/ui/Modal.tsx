import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidthClassName?: string;
}

// Pile des modales ouvertes : Échap ne ferme que celle du dessus, et le défilement de la page
// reste bloqué tant qu'il en reste une.
const openStack: string[] = [];

export function Modal({ open, onClose, title, children, maxWidthClassName = 'max-w-lg' }: ModalProps) {
  const id = useId();
  // Les appelants passent souvent une flèche inline : on garde la dernière sans relancer l'effet
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    openStack.push(id);
    document.body.style.overflow = 'hidden';

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && openStack[openStack.length - 1] === id) onCloseRef.current();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      openStack.splice(openStack.indexOf(id), 1);
      if (openStack.length === 0) document.body.style.overflow = '';
    };
  }, [open, id]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-night-950/60 px-0 sm:items-center sm:px-4"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(6px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`w-full ${maxWidthClassName} max-h-[90vh] overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[85vh] sm:rounded-2xl dark:border-night-600 dark:bg-night-800`}
            initial={{ opacity: 0, scale: 0.96, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 16, transition: { duration: 0.16, ease: 'easeIn' } }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-5 py-4 backdrop-blur dark:border-night-700 dark:bg-night-800/90">
                <h2 className="font-semibold text-night-900 dark:text-slate-100">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:rotate-90 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-night-700 dark:hover:text-slate-200"
                >
                  <X size={17} />
                </button>
              </div>
            )}
            <motion.div
              className="p-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.06 }}
            >
              {children}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
