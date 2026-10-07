import 'server-only';

export function usesRemoteContent() { return Boolean(process.env.BACKEND_ORIGIN); }

/** Frontend requests only the explicitly published content API; credentials stay on Render. */
export async function remoteContent<T>(resource: string, limit?: number): Promise<T> {
  const origin = process.env.BACKEND_ORIGIN!;
  const url = new URL('/api/public/content', origin);
  url.searchParams.set('resource', resource);
  if (limit !== undefined) url.searchParams.set('limit', String(limit));
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Content service unavailable (${response.status})`);
  return response.json() as Promise<T>;
}
