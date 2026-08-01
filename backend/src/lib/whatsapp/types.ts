export interface WhatsAppSendParams {
  toPhoneNumber: string; // format international, ex : +224628674895
  message: string;
  // Pièce jointe optionnelle (ex : reçu PDF de réception)
  attachment?: {
    filename: string;
    contentBase64: string;
    mimeType: string;
  };
}

export interface WhatsAppSendResult {
  success: boolean;
  providerMessageId?: string;
  errorMessage?: string;
}

export interface WhatsAppProvider {
  send(params: WhatsAppSendParams): Promise<WhatsAppSendResult>;
}
