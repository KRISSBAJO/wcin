// Server-side helpers around the session cookie (Node runtime only).
import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, newSessionValue, readSession, type SessionData } from './session';
import { getUser, type User } from './users';

/** The signed-in staff member for this request, or null. Cached per request. */
export const currentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const s = await readSession(jar.get(SESSION_COOKIE)?.value);
  if (!s) return null;
  try {
    const u = await getUser(s.uid);
    return u && u.active && u.has_password ? u : null;
  } catch {
    return null;
  }
});

/** Signed in at all (any role). */
export async function isAdmin(): Promise<boolean> {
  return (await currentUser()) !== null;
}

/** Use at the top of every admin server action: signed in, any role. */
export async function requireAdmin(): Promise<User> {
  const u = await currentUser();
  if (!u) redirect('/admin/login');
  return u!;
}

/** Use for users and settings: the Admin role only. Editors are sent back to the dashboard. */
export async function requireManager(): Promise<User> {
  const u = await requireAdmin();
  if (u.role !== 'admin') redirect('/admin?error=' + encodeURIComponent('That part is for admins only.'));
  return u;
}

export async function issueSession(uid: number, role: SessionData['role']): Promise<void> {
  const { value, expires } = await newSessionValue(uid, role);
  const h = await headers();
  const secure = (h.get('x-forwarded-proto') ?? '').includes('https');
  const jar = await cookies();
  jar.set(SESSION_COOKIE, value, { path: '/', httpOnly: true, sameSite: 'lax', secure, expires });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Absolute URL for links in emails, from the request the admin is using. */
export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost';
  return `${proto}://${host}`;
}
