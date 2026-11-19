import { useState, useEffect, FormEvent } from 'react';
import { updateClient } from '../clients.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { Modal, Input, Button, notify } from '@/ui';
import { useValidation } from '@/lib/validation';
import { schemaClient } from '../clientSchema';

interface ClientEditModalProps {
  client: { id: string; fullName: string; phoneGn: string | null; phoneCn: string | null; phoneWhatsapp: string | null } | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function ClientEditModal({ client, onClose, onUpdated }: ClientEditModalProps) {
  const [fullName, setFullName] = useState('');
  const [phoneGn, setPhoneGn] = useState('');
  const [phoneCn, setPhoneCn] = useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { erreurs, valider, effacer, setErreurs } = useValidation(schemaClient);

  useEffect(() => {
    if (!client) return;
    setFullName(client.fullName);
    setPhoneGn(client.phoneGn ?? '');
    setPhoneCn(client.phoneCn ?? '');
    setPhoneWhatsapp(client.phoneWhatsapp ?? '');
    setErreurs({});
  }, [client, setErreurs]);

  if (!client) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!client || submitting) return;
    if (!valider({ fullName, phoneGn, phoneCn, phoneWhatsapp })) return;
    setSubmitting(true);
    try {
      await updateClient(client.id, {
        fullName: fullName.trim(),
        phoneGn: phoneGn.trim() || undefined,
        phoneCn: phoneCn.trim() || undefined,
        phoneWhatsapp: phoneWhatsapp.trim() || undefined,
      });
      notify.success('Client mis à jour.');
      onUpdated();
      onClose();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={!!client} onClose={onClose} title="Modifier le client" maxWidthClassName="max-w-md">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Nom complet"
          type="text"
          required
          autoComplete="name"
          value={fullName}
          error={erreurs.fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            effacer('fullName');
          }}
        />
        <Input
          label="Téléphone Guinée"
          type="tel"
          inputMode="tel"
          placeholder="+224 6XX XX XX XX"
          value={phoneGn}
          error={erreurs.phoneGn}
          onChange={(e) => {
            setPhoneGn(e.target.value);
            effacer('phoneGn');
          }}
        />
        <Input
          label="Téléphone Chine"
          type="tel"
          inputMode="tel"
          placeholder="+86 1XX XXXX XXXX"
          value={phoneCn}
          error={erreurs.phoneCn}
          onChange={(e) => {
            setPhoneCn(e.target.value);
            effacer('phoneCn');
          }}
        />
        <Input
          label="WhatsApp"
          type="tel"
          inputMode="tel"
          placeholder="Numéro avec indicatif"
          value={phoneWhatsapp}
          error={erreurs.phoneWhatsapp}
          onChange={(e) => {
            setPhoneWhatsapp(e.target.value);
            effacer('phoneWhatsapp');
          }}
        />
        <Button type="submit" variant="cargo" fullWidth size="lg" loading={submitting}>
          Enregistrer
        </Button>
      </form>
    </Modal>
  );
}
