import { env } from '@/config/env';
import { WhatsAppProvider } from './types';
import { StubWhatsAppProvider } from './stubProvider';
import { GreenApiProvider } from './greenApiProvider';

// Sélectionne le fournisseur WhatsApp selon la configuration.
// Si GREEN_API_INSTANCE_ID et GREEN_API_TOKEN sont renseignés dans .env, les messages partent
// réellement via Green API. Sinon, le stub journalise les messages en console (dev uniquement
// — voir requestOtp dans auth.service.ts pour le cas particulier du code OTP).
// Pour brancher Twilio à la place : renseigner TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
// TWILIO_WHATSAPP_FROM, implémenter TwilioWhatsAppProvider (WhatsAppProvider) et le retourner ici.
export function getWhatsAppProvider(): WhatsAppProvider {
  if (env.GREEN_API_INSTANCE_ID && env.GREEN_API_TOKEN) {
    return new GreenApiProvider(env.GREEN_API_INSTANCE_ID, env.GREEN_API_TOKEN);
  }
  return new StubWhatsAppProvider();
}
