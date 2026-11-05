import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button, notify } from '@/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { copyToClipboard } from '@/lib/clipboard';
import { DocumentType, getClientLink, publicPageUrl, whatsappMessage, whatsappUrl } from './documents.api';

interface SendToClientButtonProps {
  type: DocumentType;
  id: string;
  // « link » : petit lien texte (listes compactes) ; par défaut un bouton
  appearance?: 'button' | 'link';
}

// Envoie au client, sur WhatsApp, un lien personnel pour télécharger sa facture ou son reçu.
// Sans numéro enregistré, le lien est copié pour être transmis autrement.
export function SendToClientButton({ type, id, appearance = 'button' }: SendToClientButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    // Onglet ouvert tout de suite (geste de l'utilisateur), sinon le navigateur bloquerait
    // l'ouverture de WhatsApp après l'attente du réseau.
    const tab = window.open('', '_blank');
    setLoading(true);
    try {
      const { token, summary } = await getClientLink(type, id);
      const url = publicPageUrl(token);
      if (summary.clientTelephone && tab) {
        tab.location.href = whatsappUrl(summary.clientTelephone, whatsappMessage(summary, url));
      } else {
        tab?.close();
        const copied = await copyToClipboard(url);
        notify[copied ? 'success' : 'error'](
          copied
            ? "Ce client n'a pas de numéro enregistré : lien copié, à lui transmettre."
            : `Lien du document : ${url}`,
        );
      }
    } catch (err) {
      tab?.close();
      notify.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (appearance === 'link') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1 text-emerald-600 hover:underline disabled:opacity-50 dark:text-emerald-400"
      >
        <MessageCircle size={12} />
        Envoyer
      </button>
    );
  }

  return (
    <Button variant="secondary" size="sm" loading={loading} onClick={handleClick}>
      <MessageCircle size={14} className="mr-1.5 text-emerald-500" />
      Envoyer au client
    </Button>
  );
}
