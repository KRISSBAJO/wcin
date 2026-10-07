// Staff session: a signed, expiring cookie that names the user and their role. Uses Web Crypto
// so it runs in both the Node runtime (server components, actions) and the Edge runtime (middleware).
import { env } from './env';

export const SESSION_COOKIE = 'wcin_admin';
export const SESSION_HOURS = 12;

export interface SessionData {
  uid: number;
  role: 'admin' | 'editor';
  expires: number;
}

function secret(): string {
  return env('SESSION_SECRET') || env('ADMIN_PASSWORD');
}

/** True when sessions can be signed at all. */
export function adminConfigured(): boolean {
  return Boolean(secret());
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

/** The bootstrap password from .env, used only to create the first admin account. */
export function checkPassword(given: string): boolean {
  const expected = env('ADMIN_PASSWORD');
  return Boolean(expected) && safeEqual(given, expected);
}

/** Builds the cookie value for a fresh session. */
export async function newSessionValue(uid: number, role: SessionData['role']): Promise<{ value: string; expires: Date }> {
  const expires = Date.now() + SESSION_HOURS * 3600_000;
  const payload = `${expires}:${uid}:${role}`;
  return { value: `${payload}.${await hmac(payload)}`, expires: new Date(expires) };
}

/** Checks the signature and expiry and returns what the cookie says, or null. */
export async function readSession(raw: string | undefined): Promise<SessionData | null> {
  if (!adminConfigured() || !raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot < 0) return null;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!safeEqual(sig, await hmac(payload))) return null;
  const [exp, uid, role] = payload.split(':');
  const expires = Number(exp);
  if (!(expires > Date.now())) return null;
  if (!(Number(uid) > 0) || (role !== 'admin' && role !== 'editor')) return null;
  return { uid: Number(uid), role, expires };
}

export async function sessionValid(raw: string | undefined): Promise<boolean> {
  return (await readSession(raw)) !== null;
}
