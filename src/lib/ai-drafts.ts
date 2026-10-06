// The two drafting jobs the admin offers: event copy and message (sermon) summaries.
import { draftJson } from './llm';
import { site } from '../data/site';
import { longDate, parseIsoDate, todayCentral, weekday } from './dates';

/** "Tue 2026-10-06, Wed 2026-10-07, …" for the next `days` days, so the model looks dates up instead of counting. */
function calendar(days: number): string {
  const p = parseIsoDate(todayCentral())!;
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.UTC(p.y, p.m - 1, p.d + i));
    const iso = d.toISOString().slice(0, 10);
    out.push(`${weekday(iso).slice(0, 3)} ${iso}`);
  }
  return out.join(', ');
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** If the notes name a weekday and the date disagrees, move the date forward to the next such weekday. */
function snapToNamedWeekday(iso: string, notes: string): string {
  if (!iso) return iso;
  const named = DAY_NAMES.find((d) => new RegExp(`\\b${d}s?\\b`, 'i').test(notes));
  if (!named) return iso;
  const want = DAY_NAMES.indexOf(named);
  const p = parseIsoDate(iso);
  if (!p) return iso;
  const d = new Date(Date.UTC(p.y, p.m - 1, p.d));
  if (d.getUTCDay() === want) return iso;
  // Start from today if the model's date is in the past, then walk to the next matching weekday.
  const t = parseIsoDate(todayCentral())!;
  const start = d.getTime() < Date.UTC(t.y, t.m - 1, t.d) ? new Date(Date.UTC(t.y, t.m - 1, t.d)) : d;
  for (let i = 0; i < 7; i++) {
    const c = new Date(start.getTime() + i * 86_400_000);
    if (c.getUTCDay() === want) return c.toISOString().slice(0, 10);
  }
  return iso;
}

const VOICE = `You write for ${site.name}, a branch of ${site.parent} in Nashville, Tennessee. Voice: warm, plain, confident, faith-filled, never hype. Short sentences. American English. No emojis, no exclamation marks, no hashtags.`;

export interface EventDraft {
  title: string;
  detail: string;
  starts_on: string;
  ends_on: string;
  announcement: string;
}

const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const iso = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');

/** From a rough description, produce an event title, detail line, dates and an announcement-bar line. */
export async function draftEvent(description: string): Promise<EventDraft> {
  const out = await draftJson(
    `${VOICE}
Today is ${weekday(todayCentral())} ${longDate(todayCentral())} in Nashville. Calendar for the next two weeks (weekday then date): ${calendar(15)}.
Use that calendar to resolve phrases like "this Saturday" or "next Sunday": pick the date whose weekday matches. "Next <day>" means the first such day after today.
The church meets Sundays 9:00 AM, Wednesdays 6:00 PM, and Monday to Friday 5:00 AM for Covenant Hour of Prayer.
Turn the user's notes into website copy for an event. Keys:
- "title": the event name, 2 to 6 words, Title Case, no date in it.
- "detail": one line for the event card: weekday, time, place, and who it is for, separated by " · ". Under 110 characters.
- "starts_on": the date as YYYY-MM-DD from the calendar if the notes give or imply one, else "".
- "ends_on": the last day as YYYY-MM-DD for multi-day events, else "".
- "announcement": one line for the red bar at the top of the site, under 70 characters, e.g. "Shiloh 2026 · Dec 8 to 13 · Live from Canaanland".
Do not invent times, places or speakers the notes do not give; leave them out instead.`,
    description,
  );
  const starts_on = snapToNamedWeekday(iso(out.starts_on), description);
  let ends_on = iso(out.ends_on);
  if (ends_on && starts_on && ends_on < starts_on) ends_on = '';
  let announcement = s(out.announcement, 90);
  // Keep the announcement's date in step with the corrected start date.
  if (starts_on && announcement) announcement = announcement.replace(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}\b/, longDate(starts_on).replace(/, \d{4}$/, ''));
  return { title: s(out.title, 80), detail: s(out.detail, 200), starts_on, ends_on, announcement };
}

export interface MessageDraft {
  title: string;
  description: string;
  points: string;
  video_url: string;
}

/** Title of a YouTube video, from the public oEmbed endpoint (no key needed). Empty when unavailable. */
async function youtubeTitle(url: string): Promise<string> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return '';
    const body = (await res.json()) as { title?: string };
    return body.title ?? '';
  } catch {
    return '';
  }
}

/** From a YouTube link and/or notes or a transcript, produce a message title, description and key points. */
export async function draftMessage(input: { url?: string; notes?: string }): Promise<MessageDraft> {
  const url = (input.url ?? '').trim();
  const notes = (input.notes ?? '').trim();
  const ytTitle = url && /youtu\.?be/.test(url) ? await youtubeTitle(url) : '';
  if (!notes && !ytTitle) throw new Error('Paste some notes or a transcript, or a YouTube link the app can read the title from.');
  const out = await draftJson(
    `${VOICE}
Write the website entry for a recorded sermon ("message"). Keys:
- "title": a clean message title, 3 to 8 words, Title Case. Keep the preacher's own title if the input gives one; strip channel names, dates and "LIVE" tags.
- "description": two sentences, under 260 characters, for the Watch page and search engines. Say what the message is about and who it helps.
- "points": three key takeaways, each one short sentence, separated by newlines, no bullets or numbering.
Only use what the input supports. If the input is only a title, keep the description general and honest.`,
    [ytTitle && `Video title: ${ytTitle}`, url && `Link: ${url}`, notes && `Notes or transcript:\n${notes.slice(0, 20_000)}`].filter(Boolean).join('\n\n'),
  );
  return { title: s(out.title, 200), description: s(out.description, 300), points: s(out.points, 600), video_url: url.slice(0, 500) };
}
