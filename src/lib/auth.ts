// Server-side helpers around the session cookie (Node runtime only).
import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, newSessionValue, sessionValid } from './session';

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return sessionValid(jar.get(SESSION_COOKIE)?.value);
}

/** Use at the top of every admin server action. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/admin/login');
}

export async function issueSession(): Promise<void> {
  const { value, expires } = await newSessionValue();
  const h = await headers();
  const secure = (h.get('x-forwarded-proto') ?? '').includes('https');
  const jar = await cookies();
  jar.set(SESSION_COOKIE, value, { path: '/', httpOnly: true, sameSite: 'lax', secure, expires });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
