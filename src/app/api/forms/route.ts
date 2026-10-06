import { NextResponse, type NextRequest } from 'next/server';
import { FormError, isFormType, rateLimited, storeSubmission, validate } from '@/lib/forms';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not read the form.' }, { status: 400 });
  }

  // Honeypot: real people never fill this.
  if (data.get('_gotcha')) return NextResponse.json({ ok: true });

  const type = data.get('form');
  if (!isFormType(type)) return NextResponse.json({ ok: false, error: 'Unknown form.' }, { status: 400 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
  if (rateLimited(ip)) return NextResponse.json({ ok: false, error: 'Too many submissions. Please try again later.' }, { status: 429 });

  try {
    const fields = validate(type, data);
    const id = await storeSubmission(type, fields, ip);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    if (err instanceof FormError) return NextResponse.json({ ok: false, error: err.message, field: err.field }, { status: 422 });
    console.error('[api/forms]', err);
    return NextResponse.json({ ok: false, error: 'Something went wrong. Please try again or email us.' }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ ok: false, error: 'Use POST.' }, { status: 405 });
}
