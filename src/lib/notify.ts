// Emails the office when a form comes in.
// Primary provider is MAIL_PROVIDER (resend | relykit | smtp). If it is not configured or fails,
// MAIL_FALLBACK_PROVIDER is tried (defaults to relykit when a RelyKit key is present).
// Sender is MAIL_FROM (or NOTIFY_FROM); recipient is NOTIFY_TO. Skipped silently when nothing is set.
import { env } from './env';

type Provider = 'resend' | 'relykit' | 'smtp';

function from(): string {
  return env('MAIL_FROM') || env('NOTIFY_FROM');
}

function configured(p: Provider): boolean {
  if (p === 'resend') return Boolean(env('RESEND_API_KEY'));
  if (p === 'relykit') return Boolean(env('RELYKIT_API_KEY'));
  if (p === 'smtp') return Boolean(env('SMTP_HOST'));
  return false;
}

function asProvider(value: string): Provider | null {
  const v = value.toLowerCase();
  return v === 'resend' || v === 'relykit' || v === 'smtp' ? v : null;
}

/** Providers to try, in order, skipping any that are not configured. */
export function providerChain(): Provider[] {
  const chain: Provider[] = [];
  const primary = asProvider(env('MAIL_PROVIDER'));
  const fallback = asProvider(env('MAIL_FALLBACK_PROVIDER')) ?? 'relykit';
  for (const p of [primary, fallback]) if (p && configured(p) && !chain.includes(p)) chain.push(p);
  return chain;
}

export function notifyConfigured(): boolean {
  return Boolean(from() && env('NOTIFY_TO')) && providerChain().length > 0;
}

async function viaHttp(url: string, key: string, subject: string, text: string) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: from(), to: env('NOTIFY_TO'), subject, text }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => '')}`);
}

async function viaSmtp(subject: string, text: string) {
  const nodemailer = await import('nodemailer');
  const transport = nodemailer.createTransport({
    host: env('SMTP_HOST'),
    port: Number(env('SMTP_PORT') || 587),
    secure: env('SMTP_SECURE') === 'true',
    auth: env('SMTP_USER') ? { user: env('SMTP_USER'), pass: env('SMTP_PASSWORD') } : undefined,
  });
  await transport.sendMail({ from: from(), to: env('NOTIFY_TO'), subject, text });
}

async function send(p: Provider, subject: string, text: string) {
  if (p === 'resend') return viaHttp('https://api.resend.com/emails', env('RESEND_API_KEY'), subject, text);
  if (p === 'relykit') return viaHttp(env('RELYKIT_API_URL') || 'https://api.relykit.com/emails', env('RELYKIT_API_KEY'), subject, text);
  return viaSmtp(subject, text);
}

export async function notifyOffice(subject: string, text: string): Promise<void> {
  if (!notifyConfigured()) return;
  for (const p of providerChain()) {
    try {
      await send(p, subject, text);
      return;
    } catch (err) {
      console.error(`[notify] ${p} failed, trying next:`, (err as Error).message);
    }
  }
  console.error('[notify] every mail provider failed; the submission is still saved in the database.');
}
