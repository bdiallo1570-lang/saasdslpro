import { WhatsAppProvider } from './types';
import { StubWhatsAppProvider } from './stubProvider';

// Sélectionne le fournisseur WhatsApp selon la configuration.
// Pour brancher un vrai fournisseur :
//   - Green API : renseigner GREEN_API_INSTANCE_ID et GREEN_API_TOKEN dans .env,
//     puis implémenter GreenApiProvider (WhatsAppProvider) et le retourner ici.
//   - Twilio : renseigner TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM,
//     puis implémenter TwilioWhatsAppProvider (WhatsAppProvider) et le retourner ici.
// Tant qu'aucune clé n'est configurée, le stub journalise les messages en console.
export function getWhatsAppProvider(): WhatsAppProvider {
  return new StubWhatsAppProvider();
}
