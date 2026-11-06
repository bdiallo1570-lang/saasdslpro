import { env } from '@/config/env';
import { WhatsAppProvider, WhatsAppSendParams, WhatsAppSendResult } from './types';

// Fournisseur de secours utilisé tant qu'aucune clé Green API / Twilio n'est configurée.
// Journalise le message en console (comme l'OTP en Phase 1) au lieu de l'envoyer réellement.
export class StubWhatsAppProvider implements WhatsAppProvider {
  async send(params: WhatsAppSendParams): Promise<WhatsAppSendResult> {
    // En production, un code (6 chiffres) ne doit jamais apparaître dans les journaux
    const message = env.NODE_ENV === 'production' ? params.message.replace(/\b\d{6}\b/g, '••••••') : params.message;
    console.info(
      `[WhatsApp STUB] → ${params.toPhoneNumber} : ${message}` +
        (params.attachment ? ` (pièce jointe : ${params.attachment.filename})` : ''),
    );
    return { success: true, providerMessageId: `stub-${Date.now()}` };
  }
}
