// Small helpers for admin server actions that read FormData.

export function str(data: FormData, key: string, max = 2000): string {
  const v = data.get(key);
  return (typeof v === 'string' ? v : '').trim().slice(0, max);
}

export function bool(data: FormData, key: string): number {
  return data.get(key) ? 1 : 0;
}

export function isoDate(data: FormData, key: string): string {
  const v = str(data, key, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '';
}

export function int(data: FormData, key: string, fallback = 0): number {
  const n = Number(str(data, key, 10));
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export function idParam(value: string | undefined): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export type Flash = { kind: 'ok' | 'error'; text: string } | null;
