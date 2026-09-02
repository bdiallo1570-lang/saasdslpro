import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { relancerClient } from '../paiements.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { Button, notify } from '@/ui';

interface RelanceServeur {
  mode: 'serveur';
  clientId: string;
}

interface RelanceLien {
  mode: 'lien';
  phoneNumber: string;
  message: string;
}

type RelancerWhatsAppButtonProps = (RelanceServeur | RelanceLien) & {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
};

// Bouton de relance WhatsApp réutilisable — deux modes distincts, non fusionnables :
// - "serveur" : relancerClient(clientId), nécessite la permission whatsapp:send côté backend,
//   utilisé partout où le contexte a un client connu en base (Colis, Créances).
// - "lien" : lien wa.me direct côté client, sans permission ni appel serveur, utilisé pour les
//   alertes qui n'ont qu'un numéro de téléphone brut (pas toujours un clientId fiable).
export function RelancerWhatsAppButton(props: RelancerWhatsAppButtonProps) {
  const [sending, setSending] = useState(false);
  const label = props.label ?? 'Relancer sur WhatsApp';

  if (props.mode === 'lien') {
    const numero = props.phoneNumber.replace(/\D/g, '');
    if (!numero) return null;
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(props.message)}`;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/25 transition-colors shrink-0"
      >
        <MessageCircle size={13} />
        {label}
      </a>
    );
  }

  async function handleClick() {
    if (props.mode !== 'serveur') return;
    setSending(true);
    try {
      await relancerClient(props.clientId);
      notify.success('Message de relance envoyé sur WhatsApp.');
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <Button variant="cargo" size={props.size ?? 'lg'} fullWidth={props.fullWidth} loading={sending} onClick={handleClick}>
      <MessageCircle size={16} className="mr-2" />
      {label}
    </Button>
  );
}
