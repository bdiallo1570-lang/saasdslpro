import { FormEvent, useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { apiClient, ApiResponse, extractErrorMessage } from '@/lib/apiClient';
import { Button, Input, Modal, notify } from '@/ui';
import { onChangePasswordOpen } from './commandEvents';

const RULES = [
  { label: '10 caractères minimum', test: (v: string) => v.length >= 10 },
  { label: 'Au moins une lettre', test: (v: string) => /[A-Za-z]/.test(v) },
  { label: 'Au moins un chiffre', test: (v: string) => /\d/.test(v) },
];

// « Changer mon mot de passe » (menu utilisateur). L'ancien mot de passe est exigé ; le serveur
// ferme alors toutes les sessions et renvoie une nouvelle session pour cet appareil.
export function ChangePasswordModal() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(
    () =>
      onChangePasswordOpen(() => {
        setCurrent('');
        setNext('');
        setConfirm('');
        setOpen(true);
      }),
    [],
  );

  const valid = RULES.every((r) => r.test(next)) && next === confirm && current.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      const res = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        '/auth/password/change',
        { currentPassword: current, newPassword: next },
      );
      // Les anciennes sessions sont fermées côté serveur : on garde la nouvelle
      localStorage.setItem('dsl_access_token', res.data.data!.accessToken);
      localStorage.setItem('dsl_refresh_token', res.data.data!.refreshToken);
      notify.success('Mot de passe modifié. Vos autres appareils sont déconnectés.');
      setOpen(false);
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Changer mon mot de passe" maxWidthClassName="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Mot de passe actuel"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <Input
          label="Nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <ul className="space-y-1 text-xs">
          {RULES.map((r) => {
            const ok = r.test(next);
            return (
              <li
                key={r.label}
                className={`flex items-center gap-1.5 ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}
              >
                {ok ? <Check size={13} /> : <X size={13} />}
                {r.label}
              </li>
            );
          })}
        </ul>
        <Input
          label="Confirmer le nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={confirm && confirm !== next ? 'Les deux mots de passe ne correspondent pas.' : undefined}
        />
        <Button type="submit" fullWidth loading={saving} disabled={!valid}>
          Enregistrer le nouveau mot de passe
        </Button>
      </form>
    </Modal>
  );
}
