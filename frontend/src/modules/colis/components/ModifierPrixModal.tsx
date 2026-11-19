import { useState, useEffect } from 'react';
import { Colis, updateColisPrice } from '../colis.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { Modal, Button, Input, notify } from '@/ui';
import { formatNumber } from '@/lib/format';
import { z } from 'zod';
import { nombrePositif, useValidation } from '@/lib/validation';

// Mêmes règles que le serveur (backend colis.schema.ts : updateColisPriceSchema)
const schema = z.object({
  montant: nombrePositif('Le montant doit être supérieur à 0.'),
  motif: z.string().trim().min(3, 'Un motif est requis pour justifier la modification du prix.'),
});

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
  const { erreurs, valider, effacer, setErreurs } = useValidation(schema);

  useEffect(() => {
    if (colis) {
      setMontant(colis.montantEstime ?? '');
      setMotif('');
      setErreurs({});
    }
  }, [colis, setErreurs]);

  async function handleSubmit() {
    if (!colis) return;
    if (!valider({ montant, motif })) return;
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
              {colis.montantEstime ? formatNumber(Number(colis.montantEstime)) : '—'}{' '}
              {colis.currency}
            </span>
          </p>
          <Input
            label={`Nouveau montant (${colis.currency ?? 'GNF'})`}
            type="number"
            min="1"
            value={montant}
            error={erreurs.montant}
            onChange={(e) => {
              setMontant(e.target.value);
              effacer('montant');
            }}
          />
          <Input
            label="Motif (obligatoire, tracé au journal d'audit)"
            type="text"
            value={motif}
            error={erreurs.motif}
            onChange={(e) => {
              setMotif(e.target.value);
              effacer('motif');
            }}
            placeholder="Ex : correction erreur de saisie, renégociation client"
          />
          <Button
            variant="cargo"
            fullWidth
            loading={submitting}
            onClick={handleSubmit}
          >
            Confirmer la modification
          </Button>
        </div>
      )}
    </Modal>
  );
}
