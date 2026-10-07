import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    if (process.env.BACKEND_ORIGIN) {
      const response = await fetch(new URL('/api/health', process.env.BACKEND_ORIGIN), { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Backend unavailable');
    } else await db().execute('SELECT 1');
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ ok: false }, { status: 503 }); }
}
