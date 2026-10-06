// Shared validation rules for the admin. Each returns an error message, or null when fine.
import { parseClock, parseIsoDate, todayCentral, weekday } from './dates';

const DAY_INDEX: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

/** Which weekdays a service day covers. Null means any day. */
export function allowedWeekdays(day: string): number[] | null {
  if (day in DAY_INDEX) return [DAY_INDEX[day]];
  if (/^monday to friday$/i.test(day)) return [1, 2, 3, 4, 5];
  const range = /^(\w+) to (\w+)$/i.exec(day);
  if (range && range[1] in DAY_INDEX && range[2] in DAY_INDEX) {
    const a = DAY_INDEX[range[1]], b = DAY_INDEX[range[2]];
    const out: number[] = [];
    for (let i = a; ; i = (i + 1) % 7) { out.push(i); if (i === b) break; if (out.length > 7) break; }
    return out;
  }
  return null;
}

export function weekdayOf(iso: string): number {
  const p = parseIsoDate(iso);
  return p ? new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay() : -1;
}

export function notInPast(iso: string, what = 'The date'): string | null {
  if (!iso) return null;
  return iso < todayCentral() ? `${what} is in the past. Pick today or a later date.` : null;
}

export function notInFuture(iso: string, what = 'The date'): string | null {
  if (!iso) return null;
  return iso > todayCentral() ? `${what} is in the future. Messages are added after they are preached.` : null;
}

export function endNotBeforeStart(start: string, end: string | null, what = 'The end date'): string | null {
  if (!start || !end) return null;
  return end < start ? `${what} is before the start date.` : null;
}

export function dateMatchesDay(day: string, iso: string): string | null {
  const allowed = allowedWeekdays(day);
  if (!allowed || !iso) return null;
  return allowed.includes(weekdayOf(iso)) ? null : `${iso} is a ${weekday(iso)}, but this flyer is for ${day}. Pick a ${day === 'Monday to Friday' ? 'weekday' : day}.`;
}

export function validClock(text: string, what = 'The time'): string | null {
  if (!text) return null;
  return parseClock(text) === null ? `${what} must look like "9:00 AM" or "6:30 PM".` : null;
}

export function endAfterStart(start: string, end: string): string | null {
  if (!start || !end) return null;
  const a = parseClock(start), b = parseClock(end);
  if (a === null || b === null) return null;
  return b <= a ? 'The end time must be after the start time.' : null;
}

/** A site path like "/visit" or a full http(s) link. */
export function validLink(value: string, what = 'The link'): string | null {
  if (!value) return null;
  if (value.startsWith('/') && !value.startsWith('//')) return null;
  try {
    const u = new URL(value);
    if (u.protocol === 'http:' || u.protocol === 'https:') return null;
  } catch {}
  return `${what} must be a page on this site (like /visit) or a full web address starting with https://.`;
}

export function validHttpUrl(value: string, what = 'The link'): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    if (u.protocol === 'http:' || u.protocol === 'https:') return null;
  } catch {}
  return `${what} must be a full web address starting with https://.`;
}

/** Returns the first error from a list of checks, or null. */
export function firstError(...checks: (string | null)[]): string | null {
  return checks.find((c) => c) ?? null;
}
