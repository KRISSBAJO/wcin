// Background art for flyers, from OpenAI's image model. Only used when OPENAI_API_KEY is set.
import { env } from './env';

export function openaiConfigured(): boolean {
  return Boolean(env('OPENAI_API_KEY'));
}

export class ImageGenError extends Error {}

/** Returns PNG bytes of a square background image with no text in it. */
export async function generateBackground(description: string): Promise<Uint8Array> {
  const key = env('OPENAI_API_KEY');
  if (!key) throw new ImageGenError('OPENAI_API_KEY is not set on the server.');
  const prompt = [
    `Background artwork for a church event flyer. ${description}.`,
    'Rich, cinematic, warm lighting, high contrast, with a darker lower half so white text can sit on it.',
    'Absolutely no text, no letters, no numbers, no words, no logos, no watermarks, no people\'s faces in close-up.',
  ].join(' ');
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: env('OPENAI_IMAGE_MODEL') || 'gpt-image-1', prompt, n: 1, size: '1024x1024', quality: env('OPENAI_IMAGE_QUALITY') || 'medium', output_format: 'png' }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ImageGenError(`OpenAI responded ${res.status}: ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
  const item = body.data?.[0];
  if (item?.b64_json) return new Uint8Array(Buffer.from(item.b64_json, 'base64'));
  if (item?.url) {
    const img = await fetch(item.url);
    if (!img.ok) throw new ImageGenError('Could not download the generated image.');
    return new Uint8Array(await img.arrayBuffer());
  }
  throw new ImageGenError('OpenAI returned no image.');
}

/**
 * Background art that includes the person from a reference photo, placed on the right third.
 * Uses the image-edit endpoint, which accepts reference images. Likeness is usually close but not guaranteed.
 */
export async function generateWithPerson(description: string, photo: Uint8Array, mimeType: string, who: string): Promise<Uint8Array> {
  const key = env('OPENAI_API_KEY');
  if (!key) throw new ImageGenError('OPENAI_API_KEY is not set on the server.');
  const prompt = [
    `Church event flyer artwork featuring ${who}, the person in the reference photo.`,
    'Keep their face, skin tone, hair and expression exactly as in the photo; same person, recognisable, photorealistic, no caricature.',
    'Show them from the chest up on the right third of the image, looking at the camera, in the same clothing as the photo.',
    `Background: ${description}. Rich, cinematic, warm lighting, with a darker left half so white text can sit there.`,
    'Absolutely no text, no letters, no numbers, no logos, no watermarks.',
  ].join(' ');
  const form = new FormData();
  form.set('model', env('OPENAI_IMAGE_MODEL') || 'gpt-image-1');
  form.set('prompt', prompt);
  form.set('size', '1024x1024');
  form.set('quality', env('OPENAI_IMAGE_QUALITY') || 'medium');
  form.set('input_fidelity', 'high');
  const copy = new Uint8Array(photo.byteLength);
  copy.set(photo);
  form.append('image[]', new Blob([copy.buffer as ArrayBuffer], { type: mimeType }), `reference.${mimeType.includes('png') ? 'png' : 'jpg'}`);
  const res = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ImageGenError(`OpenAI responded ${res.status}: ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = body.data?.[0]?.b64_json;
  if (!b64) throw new ImageGenError('OpenAI returned no image.');
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

/**
 * A cut-out of the person in a photo: same picture, background made transparent. Returns PNG bytes.
 * Used to build flyer cut-outs automatically when a leader photo is uploaded.
 */
export async function removeBackground(photo: Uint8Array, mimeType: string): Promise<Uint8Array> {
  const key = env('OPENAI_API_KEY');
  if (!key) throw new ImageGenError('OPENAI_API_KEY is not set on the server.');
  const form = new FormData();
  form.set('model', env('OPENAI_IMAGE_MODEL') || 'gpt-image-1');
  form.set('prompt', 'Remove the background completely and leave it fully transparent. Keep the person exactly as photographed: same face, skin tone, hair, expression, pose and clothing, same framing. Do not add anything, do not restyle, no text.');
  form.set('size', '1024x1536');
  form.set('quality', env('OPENAI_IMAGE_QUALITY') || 'medium');
  form.set('background', 'transparent');
  form.set('output_format', 'png');
  form.set('input_fidelity', 'high');
  const copy = new Uint8Array(photo.byteLength);
  copy.set(photo);
  form.append('image[]', new Blob([copy.buffer as ArrayBuffer], { type: mimeType }), `photo.${mimeType.includes('png') ? 'png' : 'jpg'}`);
  const res = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ImageGenError(`OpenAI responded ${res.status}: ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = body.data?.[0]?.b64_json;
  if (!b64) throw new ImageGenError('OpenAI returned no image.');
  return new Uint8Array(Buffer.from(b64, 'base64'));
}
