// Search and sort state for admin list pages, carried in the URL (?q=…&sort=…&dir=…) so it
// works without JavaScript and survives a refresh or the back button.

export type Dir = 'asc' | 'desc';

export interface ListState {
  q: string;
  sort: string;
  dir: Dir;
}

type Params = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

/** Reads q/sort/dir from the page's search params, falling back to the given defaults. */
export function listState(sp: Params, defaultSort: string, defaultDir: Dir = 'asc', allowed: string[] = []): ListState {
  const sort = first(sp.sort);
  const dir = first(sp.dir);
  return {
    q: first(sp.q).trim().slice(0, 80),
    sort: allowed.length === 0 || allowed.includes(sort) ? sort || defaultSort : defaultSort,
    dir: dir === 'asc' || dir === 'desc' ? dir : defaultDir,
  };
}

/** URL for the same list with some of the state changed. Empty values are dropped. */
export function listHref(path: string, state: ListState, patch: Partial<ListState> = {}, extra: Record<string, string> = {}): string {
  const next = { ...state, ...patch };
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
  if (next.q) p.set('q', next.q);
  if (next.sort) p.set('sort', next.sort);
  if (next.dir) p.set('dir', next.dir);
  const s = p.toString();
  return s ? `${path}?${s}` : path;
}

/** Clicking a column heading: same column flips the direction, a new column starts ascending. */
export function toggleHref(path: string, state: ListState, key: string, extra: Record<string, string> = {}): string {
  const dir: Dir = state.sort === key ? (state.dir === 'asc' ? 'desc' : 'asc') : 'asc';
  return listHref(path, state, { sort: key, dir }, extra);
}

/** Case-insensitive "contains" across several text fields. An empty query matches everything. */
export function textMatch(q: string, ...parts: (string | number | null | undefined)[]): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return parts.some((p) => p != null && String(p).toLowerCase().includes(needle));
}

/** Stable sort by a string or number, with empty values last in either direction. */
export function sortRows<T>(rows: T[], get: (row: T) => string | number | null | undefined, dir: Dir): T[] {
  const sign = dir === 'asc' ? 1 : -1;
  return rows
    .map((row, i) => ({ row, i, v: get(row) }))
    .sort((a, b) => {
      const ae = a.v == null || a.v === '', be = b.v == null || b.v === '';
      if (ae && be) return a.i - b.i;
      if (ae) return 1;
      if (be) return -1;
      const c = typeof a.v === 'number' && typeof b.v === 'number' ? a.v - b.v : String(a.v).localeCompare(String(b.v), undefined, { numeric: true, sensitivity: 'base' });
      return c !== 0 ? c * sign : a.i - b.i;
    })
    .map((x) => x.row);
}
