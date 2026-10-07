import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionValid } from '@/lib/session';

// Everything under /admin needs a valid session, except the sign-in pages and the one-time links
// for invites and password resets. Roles are checked by the pages themselves.
const OPEN = [/^\/admin\/login$/, /^\/admin\/forgot$/, /^\/admin\/invite\/[^/]+$/, /^\/admin\/reset\/[^/]+$/];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (process.env.BACKEND_ORIGIN) return NextResponse.redirect(new URL(pathname + search, process.env.BACKEND_ORIGIN));
  if (OPEN.some((re) => re.test(pathname))) return NextResponse.next();
  const ok = await sessionValid(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/admin/:path*'] };
