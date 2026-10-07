// Staff accounts: passwords hashed with scrypt, one-time tokens for invites and resets.
import 'server-only';
import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { all, one, run, nowIso } from './db';

const scrypt = promisify(scryptCb);

export type Role = 'admin' | 'editor';
export const ROLES: { value: Role; label: string; note: string }[] = [
  { value: 'admin', label: 'Admin', note: 'Everything, including users and settings' },
  { value: 'editor', label: 'Editor', note: 'Flyers, events, messages, ministries, leaders and the inbox' },
];

export interface UserRow {
  id: number;
  name: string;
  email: string;
  role: Role;
  password_hash: string;
  active: number;
  token_hash: string;
  token_purpose: string;
  token_expires: string;
  last_login_at: string;
  created_at: string;
}

export type User = Pick<UserRow, 'id' | 'name' | 'email' | 'role' | 'active' | 'last_login_at' | 'created_at'> & { has_password: boolean; invite_pending: boolean };

export const MIN_PASSWORD = 10;

export function isRole(v: string): v is Role {
  return v === 'admin' || v === 'editor';
}

export function normalizeEmail(v: string): string {
  return v.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltB64, hashB64] = stored.split('$');
  if (algo !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64url');
  const actual = (await scrypt(password, Buffer.from(saltB64, 'base64url'), expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** A fresh one-time token: the raw value goes in the link, only its hash is stored. */
export function newToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url');
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('base64url');
}

function toUser(r: UserRow): User {
  return {
    id: r.id, name: r.name, email: r.email, role: r.role, active: r.active, last_login_at: r.last_login_at, created_at: r.created_at,
    has_password: Boolean(r.password_hash),
    invite_pending: !r.password_hash && r.token_purpose === 'invite' && r.token_expires > nowIso(),
  };
}

export async function countUsers(): Promise<number> {
  try { return Number((await one<{ n: number }>('SELECT COUNT(*) AS n FROM users'))?.n ?? 0); } catch { return 0; }
}

export async function listUsers(): Promise<User[]> {
  return (await all<UserRow>('SELECT * FROM users ORDER BY active DESC, role ASC, name ASC')).map(toUser);
}

export async function getUser(id: number): Promise<User | null> {
  const r = await one<UserRow>('SELECT * FROM users WHERE id = ?', [id]);
  return r ? toUser(r) : null;
}

export async function getUserRow(id: number): Promise<UserRow | null> {
  return one<UserRow>('SELECT * FROM users WHERE id = ?', [id]);
}

export async function findByEmail(email: string): Promise<UserRow | null> {
  return one<UserRow>('SELECT * FROM users WHERE email = ?', [normalizeEmail(email)]);
}

export async function findByToken(raw: string, purpose: 'invite' | 'reset'): Promise<UserRow | null> {
  if (!raw || raw.length > 200) return null;
  const r = await one<UserRow>('SELECT * FROM users WHERE token_hash = ? AND token_purpose = ? AND active = 1', [hashToken(raw), purpose]);
  if (!r || r.token_expires <= nowIso()) return null;
  return r;
}

/** Creates a user with an invite token (valid 7 days) and no password yet. Returns the raw token for the link. */
export async function createInvitedUser(name: string, email: string, role: Role): Promise<{ id: number; token: string }> {
  const t = newToken();
  const expires = new Date(Date.now() + 7 * 86_400_000).toISOString();
  await run(
    'INSERT INTO users (name, email, role, password_hash, active, token_hash, token_purpose, token_expires, last_login_at, created_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?)',
    [name, normalizeEmail(email), role, '', t.hash, 'invite', expires, '', nowIso()],
  );
  const row = await findByEmail(email);
  return { id: row!.id, token: t.raw };
}

/** Issues a new token on an existing user (invite again, or password reset). */
export async function issueToken(id: number, purpose: 'invite' | 'reset', hours: number): Promise<string> {
  const t = newToken();
  const expires = new Date(Date.now() + hours * 3600_000).toISOString();
  await run('UPDATE users SET token_hash = ?, token_purpose = ?, token_expires = ? WHERE id = ?', [t.hash, purpose, expires, id]);
  return t.raw;
}

export async function setPassword(id: number, password: string): Promise<void> {
  await run("UPDATE users SET password_hash = ?, token_hash = '', token_purpose = '', token_expires = '' WHERE id = ?", [await hashPassword(password), id]);
}

export async function touchLogin(id: number): Promise<void> {
  await run('UPDATE users SET last_login_at = ? WHERE id = ?', [nowIso(), id]);
}

export async function activeAdminCount(exceptId = 0): Promise<number> {
  return Number((await one<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1 AND password_hash != '' AND id != ?", [exceptId]))?.n ?? 0);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
