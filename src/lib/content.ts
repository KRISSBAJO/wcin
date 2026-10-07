import { remoteContent, usesRemoteContent } from './remote-content';
// Reads public content from the database, falling back to the defaults in src/data/site.ts
// when a table is empty (so the site works before anything is entered in the admin).
import { all, one, run, nowIso } from './db';
import { DEFAULT_FLYERS, SETTING_KEYS, type SettingKey } from './schema';
import { events as defaultEvents, leaders as defaultLeaders, messages as defaultMessages, ministries as defaultMinistries, propheticFocus, site } from '../data/site';
import { centralToIso, longDate, parseClock, todayCentral, weekday } from './dates';

export interface EventRow {
  id: number;
  title: string;
  detail: string;
  starts_on: string;
  ends_on: string | null;
  published: number;
  image_url: string;
  image_key: string;
  created_at: string;
}

export interface MessageRow {
  id: number;
  title: string;
  speaker: string;
  preached_on: string;
  length: string;
  video_url: string;
  description: string;
  points: string;
  published: number;
  created_at: string;
}

export interface ServiceRow {
  id: number;
  day: string;
  start_time: string;
  end_time: string;
  label: string;
  note: string;
  sort: number;
  active: number;
  default_image: string;
  default_image_key: string;
  created_at: string;
}

/** A service with a ready-to-print time, e.g. "6:00 PM – 7:30 PM". */
export interface Service extends ServiceRow {
  time: string;
}

export interface SlideRow {
  id: number;
  image_url: string;
  image_key: string;
  headline: string;
  link_url: string;
  starts_on: string | null;
  ends_on: string | null;
  sort: number;
  active: number;
  service_id: number | null;
  service_day: string;
  service_date: string;
  end_date: string;
  show_until: string;
  expires_at: string;
  created_at: string;
}

/** One hero panel: the image to show (special flyer or the service's fallback) plus its service card. */
export interface HeroPanelData {
  day: string;
  image: { url: string; alt: string; link: string } | null;
  special: boolean;
  card: { eyebrow: string; times: { value: string; label: string }[] };
}

export type Settings = Record<SettingKey, string>;

const DEFAULT_SETTINGS: Settings = {
  announcement_text: site.announcement.text,
  announcement_link_text: site.announcement.linkText,
  announcement_href: site.announcement.href,
  focus_month: propheticFocus.month,
  focus_text: propheticFocus.text,
  focus_scripture: propheticFocus.scripture,
  focus_pdf: propheticFocus.pdf,
  live_stream_url: site.liveStreamUrl,
  hero_video_url: '',
  hero_video_key: '',
  hero_video_poster_url: '',
  hero_video_poster_key: '',
  photo_focus_url: '', photo_focus_key: '',
  photo_mandate_url: '', photo_mandate_key: '',
  photo_about_url: '', photo_about_key: '',
  photo_nations_url: '', photo_nations_key: '',
  youtube_source: `${site.social.youtube}/videos`,
  youtube_speaker: site.founder,
  welcome_title: 'Welcome home',
  welcome_text:
    'We are so glad you found us. Winners Chapel International Nashville is a family of believers built on the word of faith, and whoever you are and wherever you are coming from, there is a seat for you here.\n\nEvery service is packed with lively worship, prayer and a faith-building message from the Bible. Come as you are, bring your family, and expect God to meet you. We look forward to welcoming you in person this Sunday.',
};

// Settings are read on every page, so keep them in memory for a minute.
let settingsCache: { at: number; value: Settings } | null = null;
const SETTINGS_TTL_MS = 60_000;

export async function getSettings(fresh = false): Promise<Settings> {
  if (usesRemoteContent()) return remoteContent<Settings>('settings');
  if (!fresh && settingsCache && Date.now() - settingsCache.at < SETTINGS_TTL_MS) return settingsCache.value;
  const value: Settings = { ...DEFAULT_SETTINGS };
  try {
    const rows = await all<{ key: string; value: string }>('SELECT key, value FROM settings');
    for (const r of rows) if ((SETTING_KEYS as readonly string[]).includes(r.key)) (value as any)[r.key] = r.value;
  } catch (err) {
    console.error('[content] settings unavailable, using defaults:', (err as Error).message);
  }
  settingsCache = { at: Date.now(), value };
  return value;
}

export async function saveSettings(patch: Partial<Settings>) {
  const at = nowIso();
  for (const key of SETTING_KEYS) {
    if (patch[key] === undefined) continue;
    await run(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      [key, patch[key] ?? '', at],
    );
  }
  settingsCache = null;
}

function fallbackEvents(): EventRow[] {
  return defaultEvents.map((e, i) => ({
    id: -(i + 1), title: e.title, detail: e.detail, starts_on: e.date, ends_on: e.endDate ?? null, published: 1, image_url: '', image_key: '', created_at: '',
  }));
}

/** Published events from today onward (or events that have not ended yet). */
export async function getUpcomingEvents(limit = 50): Promise<EventRow[]> {
  if (usesRemoteContent()) return remoteContent<EventRow[]>('events', limit);
  const today = todayCentral();
  try {
    const rows = await all<EventRow>(
      'SELECT * FROM events WHERE published = 1 AND COALESCE(ends_on, starts_on) >= ? ORDER BY starts_on ASC LIMIT ?',
      [today, limit],
    );
    const any = await one<{ n: number }>('SELECT COUNT(*) AS n FROM events');
    if (rows.length === 0 && Number(any?.n ?? 0) === 0) return fallbackEvents().filter((e) => (e.ends_on ?? e.starts_on) >= today).slice(0, limit);
    return rows;
  } catch (err) {
    console.error('[content] events unavailable, using defaults:', (err as Error).message);
    return fallbackEvents().slice(0, limit);
  }
}

export async function getAllEvents(): Promise<EventRow[]> {
  return all<EventRow>('SELECT * FROM events ORDER BY starts_on DESC');
}

function fallbackMessages(): MessageRow[] {
  return defaultMessages.map((m, i) => ({
    id: -(i + 1), title: m.title, speaker: m.speaker, preached_on: m.date, length: m.length, video_url: m.href, description: '', points: '', published: 1, created_at: '',
  }));
}

export async function getRecentMessages(limit = 8): Promise<MessageRow[]> {
  if (usesRemoteContent()) return remoteContent<MessageRow[]>('messages', limit);
  try {
    const rows = await all<MessageRow>('SELECT * FROM messages WHERE published = 1 ORDER BY preached_on DESC LIMIT ?', [limit]);
    if (rows.length === 0) {
      const any = await one<{ n: number }>('SELECT COUNT(*) AS n FROM messages');
      if (Number(any?.n ?? 0) === 0) return fallbackMessages().slice(0, limit);
    }
    return rows;
  } catch (err) {
    console.error('[content] messages unavailable, using defaults:', (err as Error).message);
    return fallbackMessages().slice(0, limit);
  }
}

export async function getAllMessages(): Promise<MessageRow[]> {
  return all<MessageRow>('SELECT * FROM messages ORDER BY preached_on DESC');
}

// ---- Service times ----

export function withTime(row: ServiceRow): Service {
  return { ...row, time: row.end_time ? `${row.start_time} – ${row.end_time}` : row.start_time };
}

function fallbackServices(): Service[] {
  return site.services.map((s, i) =>
    withTime({ id: -(i + 1), day: s.day, start_time: s.start, end_time: s.end ?? '', label: s.label, note: s.note, sort: i, active: 1, default_image: DEFAULT_FLYERS[s.day] ?? '', default_image_key: '', created_at: '' }),
  );
}

/** Services grouped by day, in display order (Sunday's two services form one group). */
export function groupByDay(services: Service[]): { day: string; services: Service[]; image: string }[] {
  const groups: { day: string; services: Service[]; image: string }[] = [];
  for (const s of services) {
    let g = groups.find((x) => x.day === s.day);
    if (!g) { g = { day: s.day, services: [], image: '' }; groups.push(g); }
    g.services.push(s);
    if (!g.image && s.default_image) g.image = s.default_image;
  }
  return groups;
}

/** When a special flyer for `day` on `serviceDate` stops showing: 12 hours after that day's last service ends. */
export function expiryFor(serviceDate: string, dayServices: Service[]): string {
  let endMin = 0;
  for (const s of dayServices) {
    const end = parseClock(s.end_time) ?? ((parseClock(s.start_time) ?? 0) + 90);
    endMin = Math.max(endMin, end);
  }
  return centralToIso(serviceDate, endMin + 12 * 60);
}

let servicesCache: { at: number; value: Service[] } | null = null;

/** Active services in display order. Cached for a minute like settings. */
export async function getServices(fresh = false): Promise<Service[]> {
  if (usesRemoteContent()) return remoteContent<Service[]>('services');
  if (!fresh && servicesCache && Date.now() - servicesCache.at < SETTINGS_TTL_MS) return servicesCache.value;
  let value: Service[];
  try {
    const rows = await all<ServiceRow>('SELECT * FROM services WHERE active = 1 ORDER BY sort ASC, id ASC');
    if (rows.length === 0) {
      const any = await one<{ n: number }>('SELECT COUNT(*) AS n FROM services');
      value = Number(any?.n ?? 0) === 0 ? fallbackServices() : [];
    } else value = rows.map(withTime);
  } catch (err) {
    console.error('[content] services unavailable, using defaults:', (err as Error).message);
    value = fallbackServices();
  }
  servicesCache = { at: Date.now(), value };
  return value;
}

export function clearServicesCache() {
  servicesCache = null;
}

export async function getAllServices(): Promise<Service[]> {
  return (await all<ServiceRow>('SELECT * FROM services ORDER BY sort ASC, id ASC')).map(withTime);
}

// ---- Hero slides ----

/** Special flyers that are active and have not expired yet, newest first. */
export async function getLiveSlides(): Promise<SlideRow[]> {
  try {
    return await all<SlideRow>('SELECT * FROM hero_slides WHERE active = 1 AND expires_at > ? ORDER BY service_date ASC, id DESC', [new Date().toISOString()]);
  } catch (err) {
    console.error('[content] slides unavailable:', (err as Error).message);
    return [];
  }
}

/**
 * The hero: one panel per service day. Each panel shows the newest live special flyer for that day,
 * or the day's fallback flyer, with the day's service card underneath.
 */
export async function getHeroPanels(): Promise<HeroPanelData[]> {
  if (usesRemoteContent()) return remoteContent<HeroPanelData[]>('heroPanels');
  const [services, specials] = await Promise.all([getServices(), getLiveSlides()]);
  return groupByDay(services).map((g) => {
    const special = specials.find((s) => s.service_day === g.day);
    const isSunday = g.day === 'Sunday';
    const first = g.services[0];
    const card = isSunday || g.services.length > 1
      ? { eyebrow: `${g.day} service${g.services.length > 1 ? 's' : ''}`, times: g.services.map((s) => ({ value: s.time, label: s.label })) }
      : { eyebrow: first.label || g.day, times: [{ value: first.time, label: [g.day, first.note].filter(Boolean).join(' · ') }] };
    const image = special
      ? { url: special.image_url, alt: special.headline || `${g.day} service`, link: special.link_url }
      : g.image
        ? { url: g.image, alt: `${card.eyebrow} flyer`, link: '' }
        : null;
    return { day: g.day, image, special: Boolean(special), card };
  });
}

// ---- Announcement bar ----

export interface Announcement {
  text: string;
  linkText: string;
  href: string;
  auto: boolean;
}

/** Short title from a flyer caption: the part before the first "·" or " - ", capped. */
function shortTitle(headline: string): string {
  const first = headline.split(/\s[·|-]\s|·/)[0].trim();
  return (first || headline).slice(0, 70);
}

/**
 * The red bar at the top of every page. While a special flyer is live for an upcoming service,
 * the bar announces it ("This Sunday · Showers of Blessing · Oct 11"). Once it expires, the default
 * text from Settings shows again. The nearest upcoming special wins when there are several.
 */
export async function getAnnouncement(): Promise<Announcement> {
  if (usesRemoteContent()) return remoteContent<Announcement>('announcement');
  const [settings, specials] = await Promise.all([getSettings(), getLiveSlides()]);
  const fallback: Announcement = { text: settings.announcement_text, linkText: settings.announcement_link_text, href: settings.announcement_href, auto: false };
  const next = specials.filter((s) => s.service_date).sort((a, b) => a.service_date.localeCompare(b.service_date))[0];
  if (!next || !next.headline) return fallback;
  const today = todayCentral();
  const daysAway = Math.round((Date.parse(next.service_date) - Date.parse(today)) / 86_400_000);
  const multi = Boolean(next.end_date && next.end_date > next.service_date);
  const started = daysAway <= 0;
  const when = multi
    ? (started ? 'Now on' : daysAway < 7 ? 'This week' : `From ${weekday(next.service_date)}`)
    : started ? `Today` : daysAway < 7 ? `This ${weekday(next.service_date)}` : weekday(next.service_date);
  const noYear = (d: string) => longDate(d).replace(/, \d{4}$/, '');
  const dates = multi ? `${noYear(next.service_date)} to ${noYear(next.end_date).replace(/^\w+ /, '')}` : noYear(next.service_date);
  return {
    text: `${when} · ${shortTitle(next.headline)} · ${dates}`,
    linkText: next.link_url ? (next.link_url.startsWith('/watch') ? 'Watch live' : 'Plan your visit') : 'Plan your visit',
    href: next.link_url || '/visit',
    auto: true,
  };
}

// ---- Ministries ----

export interface MinistryRow {
  id: number;
  slug: string;
  tag: string;
  title: string;
  summary: string;
  body: string;
  photo_url: string;
  photo_key: string;
  dark: number;
  sort: number;
  active: number;
  created_at: string;
}

function fallbackMinistries(): MinistryRow[] {
  return defaultMinistries.map((m, i) => ({ id: -(i + 1), slug: m.id, tag: m.tag, title: m.title, summary: m.text, body: m.body, photo_url: '', photo_key: '', dark: m.dark ? 1 : 0, sort: i, active: 1, created_at: '' }));
}

export async function getMinistries(): Promise<MinistryRow[]> {
  if (usesRemoteContent()) return remoteContent<MinistryRow[]>('ministries');
  try {
    const rows = await all<MinistryRow>('SELECT * FROM ministries WHERE active = 1 ORDER BY sort ASC, id ASC');
    if (rows.length === 0) {
      const any = await one<{ n: number }>('SELECT COUNT(*) AS n FROM ministries');
      if (Number(any?.n ?? 0) === 0) return fallbackMinistries();
    }
    return rows;
  } catch (err) {
    console.error('[content] ministries unavailable, using defaults:', (err as Error).message);
    return fallbackMinistries();
  }
}

export async function getAllMinistries(): Promise<MinistryRow[]> {
  return all<MinistryRow>('SELECT * FROM ministries ORDER BY sort ASC, id ASC');
}

// ---- Leaders ----

export interface LeaderRow {
  id: number;
  name: string;
  role: string;
  bio: string;
  photo_url: string;
  photo_key: string;
  cutout_url: string;
  cutout_key: string;
  sort: number;
  active: number;
  created_at: string;
}

function fallbackLeaders(): LeaderRow[] {
  return defaultLeaders.map((l, i) => ({ id: -(i + 1), name: l.name, role: l.role, bio: l.bio, photo_url: '', photo_key: '', cutout_url: '', cutout_key: '', sort: i, active: 1, created_at: '' }));
}

export async function getLeaders(): Promise<LeaderRow[]> {
  if (usesRemoteContent()) return remoteContent<LeaderRow[]>('leaders');
  try {
    const rows = await all<LeaderRow>('SELECT * FROM leaders WHERE active = 1 ORDER BY sort ASC, id ASC');
    if (rows.length === 0) {
      const any = await one<{ n: number }>('SELECT COUNT(*) AS n FROM leaders');
      if (Number(any?.n ?? 0) === 0) return fallbackLeaders();
    }
    return rows;
  } catch (err) {
    console.error('[content] leaders unavailable, using defaults:', (err as Error).message);
    return fallbackLeaders();
  }
}

export async function getAllLeaders(): Promise<LeaderRow[]> {
  return all<LeaderRow>('SELECT * FROM leaders ORDER BY sort ASC, id ASC');
}

export async function getAllSlides(): Promise<SlideRow[]> {
  return all<SlideRow>('SELECT * FROM hero_slides ORDER BY service_date DESC, id DESC');
}
