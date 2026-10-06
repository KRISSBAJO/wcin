// AI drafting for the admin. Requires an admin session.
import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { draftEvent, draftMessage } from '@/lib/ai-drafts';
import { LlmError, textProvider } from '@/lib/llm';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  if (!textProvider()) return NextResponse.json({ ok: false, error: 'Add ANTHROPIC_API_KEY or OPENAI_API_KEY to the server to use AI drafting.' }, { status: 503 });
  let body: { kind?: string; text?: string; url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request.' }, { status: 400 });
  }
  try {
    if (body.kind === 'event') {
      const text = (body.text ?? '').trim();
      if (!text) return NextResponse.json({ ok: false, error: 'Describe the event first.' }, { status: 422 });
      return NextResponse.json({ ok: true, draft: await draftEvent(text.slice(0, 4000)) });
    }
    if (body.kind === 'message') {
      return NextResponse.json({ ok: true, draft: await draftMessage({ url: body.url, notes: body.text }) });
    }
    return NextResponse.json({ ok: false, error: 'Unknown draft type.' }, { status: 400 });
  } catch (err) {
    console.error('[api/admin/ai]', err);
    const msg = err instanceof LlmError || err instanceof Error ? err.message : 'Drafting failed.';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
