// Image storage. Uses S3 when S3_BUCKET and AWS credentials are set; otherwise writes to
// public/uploads/ so the flow works in development. The local driver is for dev only:
// production hosts should always use S3 (or any S3-compatible bucket).
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { env } from './env';

export type Driver = 's3' | 'local';

/** Bucket name from S3_BUCKET or AWS_S3_BUCKET. */
function bucket(): string {
  return env('S3_BUCKET') || env('AWS_S3_BUCKET');
}

export function storageDriver(): Driver {
  return bucket() ? 's3' : 'local';
}

export function storageDescription(): string {
  if (storageDriver() === 's3') return `S3 bucket “${bucket()}” in ${env('AWS_REGION') || 'us-east-1'}`;
  return 'local folder public/uploads (development only; set AWS_S3_BUCKET for production)';
}

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

export class UploadError extends Error {}

/** Checks the file by its leading bytes, not just the declared type. */
function sniff(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}

/** MP4 (any brand with an 'ftyp' box) or WebM, by leading bytes. */
function sniffVideo(bytes: Uint8Array): { type: string; ext: string } | null {
  const b = bytes;
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return { type: 'video/mp4', ext: 'mp4' };
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return { type: 'video/webm', ext: 'webm' };
  return null;
}

/** Stores a short background video (homepage hero). Returns its key and public URL. */
export async function storeVideo(file: File, folder = 'video'): Promise<Stored> {
  if (!file || file.size === 0) throw new UploadError('Choose a video to upload.');
  if (file.size > MAX_VIDEO_BYTES) throw new UploadError('Video is too large. Keep it under 80 MB: a 10 to 20 second clip at 1080p is usually 5 to 20 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const v = sniffVideo(bytes);
  if (!v) throw new UploadError('Only MP4 (H.264) or WebM videos are supported.');
  const key = `${folder}/${Date.now()}-${randomBytes(3).toString('hex')}-${slug(file.name)}.${v.ext}`;
  if (storageDriver() === 's3') {
    await client().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: bytes, ContentType: v.type, CacheControl: 'public, max-age=31536000, immutable' }));
    return { key, url: publicUrl(key) };
  }
  const dir = join(process.cwd(), 'public', 'uploads', folder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(process.cwd(), 'public', 'uploads', key), bytes);
  return { key, url: `/uploads/${key}` };
}

let s3: S3Client | null = null;
function client(): S3Client {
  if (s3) return s3;
  s3 = new S3Client({
    region: env('AWS_REGION') || 'us-east-1',
    ...(env('AWS_ACCESS_KEY_ID') && env('AWS_SECRET_ACCESS_KEY')
      ? { credentials: { accessKeyId: env('AWS_ACCESS_KEY_ID'), secretAccessKey: env('AWS_SECRET_ACCESS_KEY') } }
      : {}),
    ...(env('S3_ENDPOINT') ? { endpoint: env('S3_ENDPOINT'), forcePathStyle: true } : {}),
  });
  return s3;
}

/**
 * Where the browser loads an image from. With ASSET_BASE_URL set (a CloudFront distribution or a
 * public bucket URL) that is used directly. Otherwise the app serves it from /media/<key>, reading
 * the private bucket with its own credentials, so the bucket never has to be public.
 */
function publicUrl(key: string): string {
  const base = env('ASSET_BASE_URL').replace(/\/$/, '');
  if (base) return `${base}/${key}`;
  return `/media/${key}`;
}

export const KEY_RE = /^[A-Za-z0-9][A-Za-z0-9/_.-]{0,250}$/;

export interface Fetched {
  body: ReadableStream;
  contentType: string;
  contentLength?: number;
  etag?: string;
  /** Set when a byte range was requested and S3 answered with a partial object. */
  contentRange?: string;
}

/** Reads an object from S3 for the /media route. Returns null when it does not exist. */
export async function fetchImage(key: string, range?: string): Promise<Fetched | null> {
  if (!KEY_RE.test(key) || key.includes('..')) return null;
  if (storageDriver() !== 's3') return null;
  try {
    const res = await client().send(new GetObjectCommand({ Bucket: bucket(), Key: key, ...(range ? { Range: range } : {}) }));
    if (!res.Body) return null;
    return {
      body: res.Body.transformToWebStream(),
      contentType: res.ContentType || 'application/octet-stream',
      contentLength: res.ContentLength,
      etag: res.ETag,
      contentRange: res.ContentRange,
    };
  } catch (err: any) {
    if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

function slug(name: string): string {
  return name.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image';
}

export interface Stored {
  key: string;
  url: string;
}

/** Validates and stores an uploaded image under `folder/`. Returns its key and public URL. */
export async function storeImage(file: File, folder: string): Promise<Stored> {
  if (!file || file.size === 0) throw new UploadError('Choose an image to upload.');
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError('Image is too large. Keep it under 8 MB.');
  return storeBytes(new Uint8Array(await file.arrayBuffer()), folder, file.name);
}

/** Stores image bytes the app produced itself (checked the same way as uploads). */
export async function storeBytes(bytes: Uint8Array, folder: string, name: string): Promise<Stored> {
  const type = sniff(bytes);
  if (!type || !ALLOWED[type]) throw new UploadError('Only JPG, PNG, WebP or GIF images are allowed.');
  const key = `${folder}/${Date.now()}-${randomBytes(3).toString('hex')}-${slug(name)}.${ALLOWED[type]}`;

  if (storageDriver() === 's3') {
    await client().send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: key,
        Body: bytes,
        ContentType: type,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return { key, url: publicUrl(key) };
  }

  const dir = join(process.cwd(), 'public', 'uploads', folder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(process.cwd(), 'public', 'uploads', key), bytes);
  return { key, url: `/uploads/${key}` };
}

/** Removes a stored image. Never throws: a missing file is not worth failing the page for. */
export async function removeImage(key: string): Promise<void> {
  if (!key) return;
  try {
    if (storageDriver() === 's3') {
      await client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
    } else {
      await unlink(join(process.cwd(), 'public', 'uploads', key));
    }
  } catch (err) {
    console.error('[storage] remove failed:', (err as Error).message);
  }
}
