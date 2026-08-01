import { prisma } from '@/lib/prisma';
import { getWhatsAppProvider } from './provider';
import { WhatsAppSendParams } from './types';

const provider = getWhatsAppProvider();

async function sendAndLog(
  clientId: string | null,
  phoneNumber: string,
  messageType: 'CONFIRMATION_RECEPTION' | 'ARRIVEE_LOT' | 'RELANCE_IMPAYE',
  params: WhatsAppSendParams,
) {
  if (!phoneNumber) return;

  const result = await provider.send(params);

  await prisma.whatsAppMessageLog.create({
    data: {
      clientId,
      phoneNumber,
      messageType,
      status: result.success ? 'ENVOYE' : 'ECHEC',
      payload: { message: params.message },
      errorMessage: result.errorMessage ?? null,
    },
  });

  return result;
}

export async function sendConfirmationReception(
  clientId: string,
  phoneNumber: string,
  trackingId: string,
  montantEstime: number,
  currency: string,
  receiptPdfBase64?: string,
) {
  const message =
    `Bonjour, votre colis ${trackingId} a été enregistré à notre entrepôt de Guangzhou. ` +
    `Montant estimé : ${montantEstime.toLocaleString('fr-FR')} ${currency}. ` +
    `Merci de votre confiance — DSL Air Cargo.`;

  return sendAndLog(clientId, phoneNumber, 'CONFIRMATION_RECEPTION', {
    toPhoneNumber: phoneNumber,
    message,
    attachment: receiptPdfBase64
      ? { filename: `recu-${trackingId}.pdf`, contentBase64: receiptPdfBase64, mimeType: 'application/pdf' }
      : undefined,
  });
}

export async function sendArriveeLotNotification(
  clientId: string,
  phoneNumber: string,
  lotNumber: string,
  trackingIds: string[],
) {
  const message =
    `Bonjour, votre/vos colis (${trackingIds.join(', ')}) du lot ${lotNumber} ` +
    `sont arrivés à l'entrepôt DSL Air Cargo de Madina, Conakry. ` +
    `Vous pouvez venir les récupérer aux heures d'ouverture.`;

  return sendAndLog(clientId, phoneNumber, 'ARRIVEE_LOT', {
    toPhoneNumber: phoneNumber,
    message,
  });
}

export async function sendRelanceImpaye(
  clientId: string,
  phoneNumber: string,
  clientFullName: string,
  montantDu: number,
  currency: string,
) {
  const message =
    `Bonjour ${clientFullName}, nous vous rappelons que votre solde restant dû auprès de ` +
    `DSL Air Cargo est de ${montantDu.toLocaleString('fr-FR')} ${currency}. ` +
    `Merci de régulariser votre situation dès que possible. Pour toute question, contactez-nous.`;

  return sendAndLog(clientId, phoneNumber, 'RELANCE_IMPAYE', {
    toPhoneNumber: phoneNumber,
    message,
  });
}
