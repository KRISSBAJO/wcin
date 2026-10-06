const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Parses YYYY-MM-DD without timezone drift. */
export function parseIsoDate(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

export function monthDay(iso: string): { month: string; day: string } {
  const p = parseIsoDate(iso);
  if (!p) return { month: '', day: '' };
  return { month: MONTHS[p.m - 1], day: String(p.d) };
}

/** "Sep 28, 2026" */
export function longDate(iso: string): string {
  const p = parseIsoDate(iso);
  if (!p) return iso;
  return `${MONTHS[p.m - 1]} ${p.d}, ${p.y}`;
}

/** "Sunday" */
export function weekday(iso: string): string {
  const p = parseIsoDate(iso);
  if (!p) return '';
  return DAYS[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()];
}

/** Today's date as YYYY-MM-DD in Central Time (Nashville). */
export function todayCentral(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(new Date());
}

/** "6:30 PM" → minutes since midnight, or null when it cannot be read. */
export function parseClock(text: string): number | null {
  const m = /^\s*(\d{1,2})(?::(\d{2}))?\s*([AaPp])\.?[Mm]?\.?\s*$/.exec(text ?? '');
  if (!m) return null;
  let h = Number(m[1]) % 12;
  const min = Number(m[2] ?? 0);
  if (m[3].toLowerCase() === 'p') h += 12;
  return h * 60 + min;
}

function chicagoOffsetMinutes(at: Date): number {
  const part = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', timeZoneName: 'longOffset' })
    .formatToParts(at).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT-06:00';
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(part);
  if (!m) return -360;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3]));
}

/** An instant (ISO) for a wall-clock time in Nashville on a given date. Minutes may exceed 24h. */
export function centralToIso(isoDate: string, minutes: number): string {
  const p = parseIsoDate(isoDate);
  if (!p) throw new Error('Bad date');
  const guess = Date.UTC(p.y, p.m - 1, p.d) + minutes * 60_000;
  const offset = chicagoOffsetMinutes(new Date(guess));
  return new Date(guess - offset * 60_000).toISOString();
}

/** The next `count` dates (YYYY-MM-DD) that fall on `weekday` (0 = Sunday), starting today in Nashville. */
export function upcomingDates(weekday: number, count: number): string[] {
  const p = parseIsoDate(todayCentral());
  if (!p) return [];
  const out: string[] = [];
  const d = new Date(Date.UTC(p.y, p.m - 1, p.d));
  while (out.length < count) {
    if (d.getUTCDay() === weekday) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/** Embed URL for a YouTube link (watch, live, youtu.be, or channel /live). Null when it is not YouTube. */
/** The video id from any YouTube link shape we accept, or null. */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(u.hostname)) return null;
    let id = '';
    if (u.hostname.endsWith('youtu.be')) id = u.pathname.slice(1);
    else if (u.pathname.startsWith('/live/') || u.pathname.startsWith('/embed/') || u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2] ?? '';
    else if (u.pathname === '/watch') id = u.searchParams.get('v') ?? '';
    return /^[A-Za-z0-9_-]{6,}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** YouTube's own thumbnail for a video link (480×360), so sermons get a picture without any upload. */
export function youtubeThumb(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(u.hostname)) return null;
    let id = '';
    if (u.hostname.endsWith('youtu.be')) id = u.pathname.slice(1);
    else if (u.pathname.startsWith('/live/')) id = u.pathname.split('/')[2] ?? '';
    else if (u.pathname.startsWith('/embed/')) id = u.pathname.split('/')[2] ?? '';
    else if (u.pathname === '/watch') id = u.searchParams.get('v') ?? '';
    if (/^[A-Za-z0-9_-]{6,}$/.test(id)) return `https://www.youtube.com/embed/${id}?rel=0`;
    const channel = /^\/(@[A-Za-z0-9._-]+)\/live/.exec(u.pathname);
    if (channel) return null; // channel /live pages cannot be embedded without the channel id
    return null;
  } catch {
    return null;
  }
}

/** "Oct 5, 2026, 3:14 PM" in Central Time, from an ISO timestamp. */
export function stamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(d);
}
