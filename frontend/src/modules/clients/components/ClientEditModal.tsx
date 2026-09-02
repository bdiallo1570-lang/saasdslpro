import { useState, useEffect, FormEvent } from 'react';
import { updateClient } from '../clients.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { Modal, Input, Button, notify } from '@/ui';

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

  useEffect(() => {
    if (!client) return;
    setFullName(client.fullName);
    setPhoneGn(client.phoneGn ?? '');
    setPhoneCn(client.phoneCn ?? '');
    setPhoneWhatsapp(client.phoneWhatsapp ?? '');
  }, [client]);

  if (!client) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!client || !fullName.trim() || submitting) return;
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nom complet" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Téléphone Guinée" type="text" value={phoneGn} onChange={(e) => setPhoneGn(e.target.value)} />
        <Input label="Téléphone Chine" type="text" value={phoneCn} onChange={(e) => setPhoneCn(e.target.value)} />
        <Input label="WhatsApp" type="text" value={phoneWhatsapp} onChange={(e) => setPhoneWhatsapp(e.target.value)} />
        <Button type="submit" variant="cargo" fullWidth size="lg" loading={submitting} disabled={!fullName.trim()}>
          Enregistrer
        </Button>
      </form>
    </Modal>
  );
}
