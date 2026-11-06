import nodemailer, { Transporter } from 'nodemailer';
import { env } from '@/config/env';

// Envoi d'e-mails, par ordre de préférence :
//  1. API HTTP de Brevo (BREVO_API_KEY) — passe par le port 443, le seul ouvert vers l'extérieur
//     sur les serveurs gratuits de Render, qui bloquent les ports SMTP 25, 465 et 587 ;
//  2. SMTP (Gmail avec mot de passe d'application…) — hébergement payant ou autre hébergeur.
// Sans configuration, aucun e-mail ne part : l'envoi est ignoré, l'application fonctionne.
// Les délais sont courts : un fournisseur injoignable ne doit jamais faire attendre l'appelant.

const TIMEOUT_MS = 10_000;

type EmailParams = { to: string; subject: string; text: string; html: string };

// « DSL Air Cargo <contact@exemple.com> » → nom + adresse
export function parseSender(from: string | undefined, fallbackEmail: string | undefined) {
  const m = from?.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].replace(/^"|"$/g, '') || 'DSL Air Cargo', email: m[2].trim() };
  return { name: 'DSL Air Cargo', email: (from?.includes('@') ? from.trim() : fallbackEmail) ?? '' };
}

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    transporter = null;
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // 465 : TLS direct ; 587 : STARTTLS
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
  });
  return transporter;
}

export function isEmailConfigured(): boolean {
  return !!env.BREVO_API_KEY || getTransporter() !== null;
}

async function sendWithBrevo(params: EmailParams): Promise<void> {
  const sender = parseSender(env.MAIL_FROM, env.SMTP_USER);
  if (!sender.email) throw new Error("MAIL_FROM manquant : l'expéditeur doit être une adresse validée dans Brevo.");
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY!, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender,
      to: [{ email: params.to }],
      subject: params.subject,
      textContent: params.text,
      htmlContent: params.html,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Brevo a répondu ${res.status} : ${(await res.text()).slice(0, 200)}`);
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (env.BREVO_API_KEY) {
      await sendWithBrevo(params);
      return true;
    }
    const t = getTransporter();
    if (!t) return false;
    await t.sendMail({ from: env.MAIL_FROM ?? `DSL Air Cargo <${env.SMTP_USER}>`, ...params });
    return true;
  } catch (error) {
    // Jamais le contenu (il peut contenir un code) : seulement la cause de l'échec
    console.error(`E-mail non envoyé à ${params.to} :`, error instanceof Error ? error.message : error);
    return false;
  }
}

// E-mail du code de connexion / réinitialisation : sobre, lisible sur téléphone, sans image
export function codeEmail(code: string, minutes: number) {
  const text =
    `Votre code DSL Air Cargo : ${code}\n\n` +
    `Il est valable ${minutes} minutes. Ne le communiquez à personne : DSL Air Cargo ne vous le demandera jamais.\n\n` +
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.";
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f4f5;font-family:Helvetica,Arial,sans-serif;color:#111827">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0b0d12;padding:22px 28px;border-bottom:3px solid #f59e0b">
<span style="color:#ffffff;font-size:18px;font-weight:bold">DSL Air Cargo</span></td></tr>
<tr><td style="padding:28px">
<p style="margin:0 0 8px;font-size:15px">Votre code de vérification :</p>
<p style="margin:0 0 20px;font-size:34px;font-weight:bold;letter-spacing:8px;color:#0b0d12">${code}</p>
<p style="margin:0 0 8px;font-size:13px;color:#4b5563">Valable ${minutes} minutes. Ne le communiquez à personne : DSL Air Cargo ne vous le demandera jamais.</p>
<p style="margin:0;font-size:13px;color:#6b7280">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject: `Votre code DSL Air Cargo : ${code}`, text, html };
}
