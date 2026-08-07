import { useState, useEffect } from 'react';
import { Colis, updateColisPrice } from '../colis.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { Modal, Button, Input, notify } from '@/ui';

interface ModifierPrixModalProps {
  colis: Colis | null;
  onClose: () => void;
  onUpdated: (colis: Colis) => void;
}

// Modification du prix par l'Agent Chine/Admin — verrouillée dès qu'un paiement a été
// enregistré sur le colis (409 renvoyé par le backend, affiché tel quel). Motif obligatoire,
// tracé dans le journal d'audit avec l'ancien et le nouveau montant.
export function ModifierPrixModal({ colis, onClose, onUpdated }: ModifierPrixModalProps) {
  const [montant, setMontant] = useState('');
  const [motif, setMotif] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (colis) {
      setMontant(colis.montantEstime ?? '');
      setMotif('');
    }
  }, [colis]);

  async function handleSubmit() {
    if (!colis || !montant || !motif.trim()) return;
    setSubmitting(true);
    try {
      const updated = await updateColisPrice(colis.trackingId, Number(montant), motif.trim());
      notify.success('Prix mis à jour.');
      onUpdated(updated);
      onClose();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={!!colis} onClose={onClose} title={`Modifier le prix — ${colis?.trackingId ?? ''}`}>
      {colis && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Prix actuel :{' '}
            <span className="font-semibold text-night-900 dark:text-slate-100">
              {colis.montantEstime ? Number(colis.montantEstime).toLocaleString('fr-FR') : '—'}{' '}
              {colis.currency}
            </span>
          </p>
          <Input
            label={`Nouveau montant (${colis.currency ?? 'GNF'})`}
            type="number"
            min="1"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
          />
          <Input
            label="Motif (obligatoire, tracé au journal d'audit)"
            type="text"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex : correction erreur de saisie, renégociation client"
          />
          <Button
            variant="cargo"
            fullWidth
            loading={submitting}
            disabled={!montant || !motif.trim()}
            onClick={handleSubmit}
          >
            Confirmer la modification
          </Button>
        </div>
      )}
    </Modal>
  );
}
