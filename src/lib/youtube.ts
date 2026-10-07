// Reads a YouTube channel's Videos tab or a playlist page and the watch page of a video, without an API key.
// YouTube does not publish RSS for this channel any more, so this parses the page data YouTube ships to browsers.
import 'server-only';

export interface YtListing {
  id: string;
  title: string;
  duration: string;   // "58:12" as shown on the thumbnail
  age: string;        // "2w ago" (relative, only used for display)
}

export interface YtDetails {
  id: string;
  title: string;
  uploadDate: string; // YYYY-MM-DD
  description: string;
  channel: string;
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

async function page(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`YouTube answered ${res.status} for ${url}`);
  return res.text();
}

function unescapeJson(s: string): string {
  try { return JSON.parse(`"${s}"`); } catch { return s; }
}

/** Turns a channel handle, channel URL or playlist URL into the page that lists its videos. */
export function sourceUrl(input: string): string {
  const v = input.trim();
  if (!v) return 'https://www.youtube.com/@lfcww/videos';
  if (/list=/.test(v)) return v;
  if (/^@/.test(v)) return `https://www.youtube.com/${v}/videos`;
  if (/youtube\.com\/(@[^/?]+|channel\/[^/?]+|c\/[^/?]+|user\/[^/?]+)/.test(v)) {
    // Keep a Streams tab if that is what was given (full services); anything else becomes the Videos tab.
    const tab = /\/streams\/?(\?.*)?$/.test(v) ? 'streams' : 'videos';
    return v.replace(/\/(videos|streams|playlists|featured)?\/?(\?.*)?$/, '') + '/' + tab;
  }
  return v;
}

/** The latest videos on a channel's Videos tab or in a playlist, newest first as YouTube lists them. */
export async function listVideos(url: string, limit = 12): Promise<YtListing[]> {
  const html = await page(url);
  const out: YtListing[] = [];
  const seen = new Set<string>();
  // Playlist pages
  for (const m of html.matchAll(/"playlistVideoRenderer":\{"videoId":"([A-Za-z0-9_-]{11})"/g)) {
    const seg = html.slice(m.index!, m.index! + 6000);
    const title = /"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/.exec(seg);
    const dur = /"lengthText":\{"accessibility":\{"accessibilityData":\{"label":"[^"]*"\},"simpleText":"([0-9:]+)"/.exec(seg);
    if (!seen.has(m[1]) && title) { seen.add(m[1]); out.push({ id: m[1], title: unescapeJson(title[1]), duration: dur?.[1] ?? '', age: '' }); }
    if (out.length >= limit) return out;
  }
  // Channel Videos tab (current "lockup" layout)
  for (const m of html.matchAll(/"lockupViewModel":\{"contentImage"/g)) {
    const seg = html.slice(m.index!, m.index! + 12000);
    const id = /"videoId":"([A-Za-z0-9_-]{11})"/.exec(seg)?.[1];
    const title = /"lockupMetadataViewModel":\{"title":\{"content":"((?:[^"\\]|\\.)*)"/.exec(seg);
    const dur = /"thumbnailBadgeViewModel":\{"text":"([0-9:]+)"/.exec(seg);
    const texts = [...seg.matchAll(/"text":\{"content":"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1]);
    if (id && title && !seen.has(id)) {
      seen.add(id);
      out.push({ id, title: unescapeJson(title[1]), duration: dur?.[1] ?? '', age: texts.find((t) => /ago$/.test(t)) ?? '' });
    }
    if (out.length >= limit) break;
  }
  return out;
}

/** Exact upload date and the first lines of the description, from the watch page. */
export async function videoDetails(id: string): Promise<YtDetails> {
  const html = await page(`https://www.youtube.com/watch?v=${id}`);
  const date = /"uploadDate":"(\d{4}-\d{2}-\d{2})/.exec(html)?.[1] ?? /"publishDate":"(\d{4}-\d{2}-\d{2})/.exec(html)?.[1] ?? '';
  const title = /"videoDetails":\{[^}]*?"title":"((?:[^"\\]|\\.)*)"/.exec(html)?.[1] ?? /<meta name="title" content="([^"]*)"/.exec(html)?.[1] ?? '';
  const desc = /"shortDescription":"((?:[^"\\]|\\.)*)"/.exec(html)?.[1] ?? '';
  const channel = /"ownerChannelName":"((?:[^"\\]|\\.)*)"/.exec(html)?.[1] ?? '';
  return { id, title: unescapeJson(title), uploadDate: date, description: unescapeJson(desc), channel: unescapeJson(channel) };
}

/** "1:02:15" → "62 min", "4:39" → "5 min". */
export function durationToLength(d: string): string {
  const parts = d.split(':').map(Number);
  if (parts.some(Number.isNaN) || parts.length === 0) return '';
  const secs = parts.reduce((a, b) => a * 60 + b, 0);
  const min = Math.round(secs / 60);
  return min >= 1 ? `${min} min` : '';
}

/** The first one or two sentences of a description, trimmed for the Watch page. Sentences that carried links are dropped whole. */
export function summarise(desc: string, max = 220): string {
  const sentences = desc.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).filter((t) => t.length >= 20 && !/https?:\/\/|www\.|\.(com|org|net)|@/i.test(t));
  const text = sentences.slice(0, 2).join(' ').trim();
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 1).replace(/\s\S*$/, '') + '…' : text;
}

/**
 * Service stream titles arrive as "COVENANT HOUR OF PRAYER | 6, OCTOBER 2026 | FAITH TABERNACLE OTA".
 * Keeps the service name, drops the date and venue parts, and settles all-caps into title case.
 */
export function tidyTitle(raw: string): string {
  const first = raw.split('|')[0].trim();
  const text = first || raw.trim();
  if (text !== text.toUpperCase()) return text;
  const small = new Set(['of', 'the', 'and', 'in', 'on', 'at', 'to', 'for', 'with', 'a', 'an']);
  return text.toLowerCase().split(/\s+/).map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
}
