// Single-admin session: a signed, expiring cookie. Uses Web Crypto so it runs in both the
// Node runtime (server components, actions) and the Edge runtime (middleware).
import { env } from './env';

export const SESSION_COOKIE = 'wcin_admin';
export const SESSION_HOURS = 12;

function secret(): string {
  return env('SESSION_SECRET') || env('ADMIN_PASSWORD');
}

export function adminConfigured(): boolean {
  return Boolean(env('ADMIN_PASSWORD'));
}

const enc = new TextEncoder();

async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return Buffer.from(sig).toString('base64url');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function checkPassword(given: string): boolean {
  const expected = env('ADMIN_PASSWORD');
  return Boolean(expected) && safeEqual(given, expected);
}

/** Builds the cookie value for a fresh session. */
export async function newSessionValue(): Promise<{ value: string; expires: Date }> {
  const expires = Date.now() + SESSION_HOURS * 3600_000;
  const payload = String(expires);
  return { value: `${payload}.${await hmac(payload)}`, expires: new Date(expires) };
}

export async function sessionValid(raw: string | undefined): Promise<boolean> {
  if (!adminConfigured() || !raw) return false;
  const dot = raw.lastIndexOf('.');
  if (dot < 0) return false;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!safeEqual(sig, await hmac(payload))) return false;
  return Number(payload) > Date.now();
}
