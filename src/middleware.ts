import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionValid } from '@/lib/session';

// Everything under /admin needs a valid session, except the login page.
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === '/admin/login') return NextResponse.next();
  const ok = await sessionValid(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/admin/:path*'] };
