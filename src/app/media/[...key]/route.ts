// Serves uploaded images from the private S3 bucket: /media/hero/123-abc-photo.jpg
// Keys are unique per upload, so responses are cached for a year.
import type { NextRequest } from 'next/server';
import { fetchImage } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const joined = key.join('/');
  // Videos are fetched in byte ranges; pass a well-formed range through so playback can start and loop at once.
  const range = request.headers.get('range') ?? undefined;
  let found;
  try {
    found = await fetchImage(joined, range && /^bytes=\d*-\d*$/.test(range) ? range : undefined);
  } catch (err) {
    console.error('[media]', (err as Error).message);
    return new Response('Storage error', { status: 502 });
  }
  if (!found) return new Response('Not found', { status: 404 });

  if (found.etag && request.headers.get('if-none-match') === found.etag) {
    return new Response(null, { status: 304, headers: { ETag: found.etag } });
  }
  const headers = new Headers({
    'Accept-Ranges': 'bytes',
    'Content-Type': found.contentType,
    'Cache-Control': found.contentRange ? 'private, no-store' : 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    'Vary': 'Range',
    'X-Content-Type-Options': 'nosniff',
  });
  // ?download=flyer-name makes the browser save the file instead of showing it.
  const download = request.nextUrl.searchParams.get('download');
  if (download !== null) {
    const ext = joined.match(/\.[a-z0-9]+$/i)?.[0] ?? '';
    const name = (download || 'flyer').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'flyer';
    headers.set('Content-Disposition', `attachment; filename="${name}${ext}"`);
  }
  if (found.contentLength) headers.set('Content-Length', String(found.contentLength));
  if (found.etag) headers.set('ETag', found.etag);
  if (found.contentRange) {
    headers.set('Content-Range', found.contentRange);
    return new Response(found.body, { status: 206, headers });
  }
  return new Response(found.body, { status: 200, headers });
}
