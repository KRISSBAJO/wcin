// Generates a flyer image (AI background + brand text) and stores it as a draft asset.
// The admin form then attaches it to a slide on submit. Requires an admin session.
import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { openaiConfigured, generateBackground, generateWithPerson, ImageGenError } from '@/lib/openai';
import { composeFlyer } from '@/lib/flyer';
import { site } from '@/data/site';

const MONTHS = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
/** "11th Oct." */
function ordinalDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${ordinal(d)} ${MONTHS[m - 1]}`;
}
/** "7th – 9th Oct." or "30th Sept. – 2nd Oct." */
function dateRange(from: string, to: string): string {
  const [, m1, d1] = from.split('-').map(Number);
  const [, m2, d2] = to.split('-').map(Number);
  return m1 === m2 ? `${ordinal(d1)} – ${ordinal(d2)} ${MONTHS[m1 - 1]}` : `${ordinal(d1)} ${MONTHS[m1 - 1]} – ${ordinal(d2)} ${MONTHS[m2 - 1]}`;
}
/** "6:00 PM" → "6PM", "9:30 AM" → "9:30AM" */
function shortClock(t: string): string {
  const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m)$/i);
  if (!m) return t.trim();
  return `${m[1]}${m[2] && m[2] !== '00' ? `:${m[2]}` : ''}${m[3].toUpperCase()}`;
}
import { fetchImage, storeBytes } from '@/lib/storage';
import { getServices } from '@/lib/content';
import { one } from '@/lib/db';
import type { FlyerPortrait } from '@/lib/flyer';

async function streamToBytes(stream: ReadableStream): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

interface LeaderRef { name: string; role: string; cutout_key: string; photo_key: string }

/** The cut-out for a leader, read from storage. Null when the leader has none. */
async function leaderPortrait(l: LeaderRef): Promise<FlyerPortrait | null> {
  if (!l.cutout_key) return null;
  const found = await fetchImage(l.cutout_key);
  if (!found) return null;
  return { image: await streamToBytes(found.body), name: l.name, role: l.role };
}

/** The leader's photo (or cut-out as a fallback) as a reference for the image model. */
async function leaderReference(l: LeaderRef): Promise<{ bytes: Uint8Array; type: string } | null> {
  const key = l.photo_key || l.cutout_key;
  if (!key) return null;
  const found = await fetchImage(key);
  if (!found) return null;
  return { bytes: await streamToBytes(found.body), type: found.contentType };
}

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  if (!openaiConfigured()) return NextResponse.json({ ok: false, error: 'Add OPENAI_API_KEY to the server to generate flyers.' }, { status: 503 });
  let body: { title?: string; scene?: string; eyebrow?: string; service_day?: string; service_date?: string; end_date?: string; leader_id?: number | string; leader_mode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request.' }, { status: 400 });
  }
  const title = (body.title ?? '').trim().slice(0, 60);
  const scene = (body.scene ?? '').trim().slice(0, 300) || 'golden light breaking through clouds over a calm landscape';
  const serviceDay = (body.service_day ?? '').trim().slice(0, 40);
  const serviceDate = /^\d{4}-\d{2}-\d{2}$/.test(body.service_date ?? '') ? body.service_date! : '';
  const endDate = /^\d{4}-\d{2}-\d{2}$/.test(body.end_date ?? '') && body.end_date! > serviceDate ? body.end_date! : '';
  if (!title) return NextResponse.json({ ok: false, error: 'Give the flyer a title first.' }, { status: 422 });
  if (!serviceDay || !serviceDate) return NextResponse.json({ ok: false, error: 'Pick the service and its date first, so the flyer shows the right time.' }, { status: 422 });

  const dayServices = (await getServices(true)).filter((s) => s.day === serviceDay);
  // Start times only, like the printed flyers ("6PM", "9AM").
  const time = dayServices.map((s) => shortClock(s.start_time)).filter(Boolean).join(' & ') || serviceDay;
  const eyebrow = (body.eyebrow ?? '').trim().slice(0, 40) || (endDate ? 'Join us this week for' : `Join us this ${serviceDay === 'Monday to Friday' ? 'week' : serviceDay} for`);
  const date = endDate ? dateRange(serviceDate, endDate) : ordinalDate(serviceDate);
  const lines = [site.address.street, `${site.address.city}, ${site.address.state} ${site.address.zip}`, site.url.replace(/^https?:\/\//, 'www.'), site.phone];

  const leaderId = Number(body.leader_id) || 0;
  const leaderMode = body.leader_mode === 'paint' ? 'paint' : 'cutout';
  try {
    const text = { eyebrow, headline: title, time, date, lines, footer: "Winners Chapel Int'l, Nashville" };
    let bytes: Uint8Array;
    if (!leaderId) {
      bytes = await composeFlyer(await generateBackground(scene), text);
    } else {
      const leader = await one<LeaderRef>('SELECT name, role, cutout_key, photo_key FROM leaders WHERE id = ? AND active = 1', [leaderId]);
      if (!leader) return NextResponse.json({ ok: false, error: 'That leader was not found.' }, { status: 422 });
      if (leaderMode === 'paint') {
        // The AI paints the person in from their photo; the text goes on the left.
        const ref = await leaderReference(leader);
        if (!ref) return NextResponse.json({ ok: false, error: 'That leader has no photo yet. Upload one under Leaders first.' }, { status: 422 });
        const background = await generateWithPerson(scene, ref.bytes, ref.type, `${leader.name}${leader.role ? `, ${leader.role}` : ''}`);
        bytes = await composeFlyer(background, text, null, { align: 'left' });
      } else {
        const portrait = await leaderPortrait(leader);
        if (!portrait) return NextResponse.json({ ok: false, error: 'That leader has no flyer cut-out yet. Upload one under Leaders, or choose "Let the AI paint them in".' }, { status: 422 });
        const background = await generateBackground(`${scene}. Keep the right third of the picture calm and uncluttered`);
        bytes = await composeFlyer(background, text, portrait);
      }
    }
    const stored = await storeBytes(bytes, 'hero/drafts', `${title}-${serviceDate}${endDate ? `-to-${endDate}` : ''}`);
    return NextResponse.json({ ok: true, url: stored.url, key: stored.key });
  } catch (err) {
    console.error('[api/admin/ai/flyer]', err);
    return NextResponse.json({ ok: false, error: err instanceof ImageGenError ? err.message : `Could not generate the flyer: ${(err as Error).message}` }, { status: 500 });
  }
}
