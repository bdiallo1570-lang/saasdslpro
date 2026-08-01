import { WhatsAppProvider, WhatsAppSendParams, WhatsAppSendResult } from './types';

// Fournisseur de secours utilisé tant qu'aucune clé Green API / Twilio n'est configurée.
// Journalise le message en console (comme l'OTP en Phase 1) au lieu de l'envoyer réellement.
export class StubWhatsAppProvider implements WhatsAppProvider {
  async send(params: WhatsAppSendParams): Promise<WhatsAppSendResult> {
    console.info(
      `[WhatsApp STUB] → ${params.toPhoneNumber} : ${params.message}` +
        (params.attachment ? ` (pièce jointe : ${params.attachment.filename})` : ''),
    );
    return { success: true, providerMessageId: `stub-${Date.now()}` };
  }
}
