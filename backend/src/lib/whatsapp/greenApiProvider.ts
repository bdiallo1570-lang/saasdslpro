import { WhatsAppProvider, WhatsAppSendParams, WhatsAppSendResult } from './types';

const GREEN_API_BASE_URL = 'https://api.green-api.com';

function toChatId(phoneNumber: string): string {
  // Green API attend un identifiant de chat au format "<numéro sans +>@c.us".
  return `${phoneNumber.replace(/\D/g, '')}@c.us`;
}

export class GreenApiProvider implements WhatsAppProvider {
  constructor(private instanceId: string, private token: string) {}

  async send(params: WhatsAppSendParams): Promise<WhatsAppSendResult> {
    try {
      const chatId = toChatId(params.toPhoneNumber);

      if (params.attachment) {
        const res = await fetch(
          `${GREEN_API_BASE_URL}/waInstance${this.instanceId}/sendFileByUpload/${this.token}`,
          {
            method: 'POST',
            body: (() => {
              const form = new FormData();
              form.append('chatId', chatId);
              form.append('caption', params.message);
              const bytes = Buffer.from(params.attachment.contentBase64, 'base64');
              form.append(
                'file',
                new Blob([bytes], { type: params.attachment.mimeType }),
                params.attachment.filename,
              );
              return form;
            })(),
          },
        );
        return await parseGreenApiResponse(res);
      }

      const res = await fetch(`${GREEN_API_BASE_URL}/waInstance${this.instanceId}/sendMessage/${this.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: params.message }),
      });
      return await parseGreenApiResponse(res);
    } catch (error) {
      return { success: false, errorMessage: error instanceof Error ? error.message : 'Erreur inconnue.' };
    }
  }
}

async function parseGreenApiResponse(res: Response): Promise<WhatsAppSendResult> {
  const body = (await res.json().catch(() => null)) as { idMessage?: string } | null;
  if (!res.ok || !body?.idMessage) {
    return { success: false, errorMessage: `Green API a répondu ${res.status}.` };
  }
  return { success: true, providerMessageId: body.idMessage };
}
