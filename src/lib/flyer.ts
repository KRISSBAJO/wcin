// Lays flyer text over a background image in the church's house style and produces a 1200×1200 PNG.
// Layout follows the printed flyers: logo and church name at the top, "Join us this … for" line,
// a big gold title, the date and time, the address block bottom-right, and an optional leader
// cut-out bottom-left with their name and role.
import { join } from 'node:path';
import { createCanvas, loadImage, GlobalFonts, type SKRSContext2D, type Image } from '@napi-rs/canvas';

const SIZE = 1200;
let fontsReady = false;
let logo: Image | null | undefined;

function ensureFonts() {
  if (fontsReady) return;
  const dir = join(process.cwd(), 'public', 'fonts');
  GlobalFonts.registerFromPath(join(dir, 'BebasNeue-Regular.ttf'), 'Bebas Neue');
  GlobalFonts.registerFromPath(join(dir, 'SourceSans3.ttf'), 'Source Sans 3');
  fontsReady = true;
}

async function loadLogo(): Promise<Image | null> {
  if (logo !== undefined) return logo;
  try { logo = await loadImage(join(process.cwd(), 'public', 'logo.png')); } catch { logo = null; }
  return logo;
}

export interface FlyerText {
  eyebrow: string;   // "Join us this Sunday for"
  headline: string;  // "Showers of Blessings" (wrapped onto up to three lines)
  time: string;      // "9:00 AM – 11:00 AM"
  footer: string;    // "Winners Chapel Int'l, Nashville" (under the logo)
  date?: string;     // "7th – 9th Oct." (shown with the time)
  lines?: string[];  // address block, bottom right
}

/** A cut-out photo (transparent PNG) placed bottom-left, with name and role beside it. */
export interface FlyerPortrait {
  image: Uint8Array;
  name: string;
  role: string;
}

interface Palette {
  light: boolean;
  text: string;       // body text
  soft: string;       // secondary text
  eyebrow: string;
  stroke: string;     // title outline
  gold: [string, string, string];
}

const LIGHT: Palette = { light: true, text: '#1d1d20', soft: '#3a3a40', eyebrow: '#a3101c', stroke: '#6e0a12', gold: ['#f6d77a', '#c9931a', '#7a5200'] };
const DARK: Palette = { light: false, text: '#ffffff', soft: 'rgba(255,255,255,0.9)', eyebrow: '#f0c04a', stroke: '#2a0608', gold: ['#fff1b8', '#e8b53a', '#a8720e'] };

/** Splits a headline into lines that fit the width. */
function wrap(ctx: SKRSContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width <= maxWidth || !line) line = test;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

/** Biggest font size whose wrapped lines fit the width and the height, keeping every word. */
function fitHeadline(ctx: SKRSContext2D, text: string, maxWidth: number, maxHeight: number, maxLines: number, from: number, to: number): { size: number; lines: string[] } {
  const words = text.trim().split(/\s+/).length;
  let lines: string[] = [];
  let size = from;
  for (; size >= to; size -= 8) {
    ctx.font = `${size}px "Bebas Neue"`;
    lines = wrap(ctx, text, maxWidth, maxLines);
    const fitsWidth = lines.every((l) => ctx.measureText(l).width <= maxWidth);
    const fitsHeight = lines.length * size * 0.9 <= maxHeight;
    if (fitsWidth && fitsHeight && lines.join(' ').split(' ').length >= words) break;
  }
  return { size, lines };
}

/** Average brightness (0..1) of a region, to pick dark text on light art and vice versa. */
function brightness(ctx: SKRSContext2D, x: number, y: number, w: number, h: number): number {
  const data = ctx.getImageData(x, y, w, h).data;
  let sum = 0, n = 0;
  for (let i = 0; i < data.length; i += 4 * 7) { sum += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255; n++; }
  return n ? sum / n : 0.5;
}

function drawBackground(ctx: SKRSContext2D, img: Image | null) {
  if (img) {
    const scale = Math.max(SIZE / img.width, SIZE / img.height);
    const w = img.width * scale, h = img.height * scale;
    ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
  } else {
    const g = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    g.addColorStop(0, '#8f0f1a'); g.addColorStop(0.55, '#b3121f'); g.addColorStop(1, '#3a0a0e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, SIZE, SIZE);
  }
}

/** Gold, bevelled title text: a dark offset "depth", an outline, then a vertical gold gradient fill. */
function drawGoldLine(ctx: SKRSContext2D, text: string, x: number, y: number, size: number, p: Palette) {
  ctx.font = `${size}px "Bebas Neue"`;
  ctx.lineJoin = 'round';
  // depth
  ctx.fillStyle = p.stroke;
  for (let d = Math.max(3, size * 0.045); d > 0; d -= 1.5) ctx.fillText(text, x + d * 0.6, y + d);
  // outline
  ctx.lineWidth = Math.max(3, size * 0.035);
  ctx.strokeStyle = p.stroke;
  ctx.strokeText(text, x, y);
  // gold fill
  const g = ctx.createLinearGradient(0, y - size * 0.8, 0, y + size * 0.08);
  g.addColorStop(0, p.gold[0]); g.addColorStop(0.55, p.gold[1]); g.addColorStop(1, p.gold[2]);
  ctx.fillStyle = g;
  ctx.fillText(text, x, y);
  // highlight sheen on the upper half
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.rect(x - size * 6, y - size * 0.8, size * 12, size * 0.36); ctx.clip();
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * Draws the text over the background and returns PNG bytes. `background` may be any image format the canvas can read.
 * The portrait, when given, stands bottom-left; the `align` option is kept for callers but the house layout is always used.
 */
export async function composeFlyer(background: Uint8Array | null, text: FlyerText, portrait?: FlyerPortrait | null, _options?: { align?: 'center' | 'left' }): Promise<Uint8Array> {
  ensureFonts();
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  const img = background ? await loadImage(Buffer.from(background)) : null;
  drawBackground(ctx, img);

  // Pick the palette from the art behind the title, then soften that area a little so the words read.
  const p = brightness(ctx, 100, 260, SIZE - 200, 520) > 0.55 ? LIGHT : DARK;
  const veil = ctx.createLinearGradient(0, 0, 0, SIZE);
  if (p.light) {
    veil.addColorStop(0, 'rgba(255,255,255,0.55)'); veil.addColorStop(0.35, 'rgba(255,255,255,0.35)'); veil.addColorStop(0.7, 'rgba(255,255,255,0.15)'); veil.addColorStop(1, 'rgba(255,255,255,0.5)');
  } else {
    veil.addColorStop(0, 'rgba(10,10,12,0.5)'); veil.addColorStop(0.35, 'rgba(10,10,12,0.25)'); veil.addColorStop(0.7, 'rgba(10,10,12,0.2)'); veil.addColorStop(1, 'rgba(10,10,12,0.75)');
  }
  ctx.fillStyle = veil; ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.textBaseline = 'alphabetic';
  const cx = SIZE / 2;

  // Logo and church name
  let y = 44;
  const lg = await loadLogo();
  if (lg) {
    const h = 120, w = (lg.width / lg.height) * h;
    ctx.drawImage(lg, cx - w / 2, y, w, h);
    y += h + 14;
  }
  ctx.textAlign = 'center';
  ctx.font = '600 30px "Source Sans 3"'; ctx.fillStyle = p.text;
  drawTracked(ctx, text.footer.toUpperCase(), cx, y + 28, 3);
  y += 28 + 52;

  // Eyebrow: "Join us this Sunday for"
  ctx.font = '600 46px "Source Sans 3"'; ctx.fillStyle = p.eyebrow;
  drawTracked(ctx, text.eyebrow, cx, y + 40, 1.5);
  y += 40 + 34;

  // Vertical plan: the address block owns the bottom, the date line sits just above it,
  // and the title is centred in the band between the eyebrow and the date line.
  const lineCount = (text.lines ?? []).filter(Boolean).length;
  const addressTop = lineCount ? SIZE - 56 - 44 * (lineCount - 1) - 36 : SIZE - 60;
  const dateBaseline = addressTop - 44;
  const bandTop = y, bandBottom = dateBaseline - 100;
  const { size, lines } = fitHeadline(ctx, text.headline, SIZE - 140, bandBottom - bandTop, 3, 230, 100);
  const lineH = size * 0.9;
  const blockH = lineH * lines.length;
  const titleTop = bandTop + Math.max(0, (bandBottom - bandTop - blockH) / 2);
  lines.forEach((l, i) => drawGoldLine(ctx, l, cx, titleTop + lineH * (i + 1) - size * 0.05, size, p));

  // Portrait bottom-left (drawn before the date line so the date reads over it)
  let portraitRight = 0;
  if (portrait) {
    const photo = await loadImage(Buffer.from(portrait.image));
    const maxH = SIZE * 0.42, maxW = SIZE * 0.36;
    const s = Math.min(maxH / photo.height, maxW / photo.width);
    const pw = photo.width * s, ph = photo.height * s;
    const px = 24, py = SIZE - ph;
    portraitRight = px + pw;
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 36; ctx.shadowOffsetX = 8;
    ctx.drawImage(photo, px, py, pw, ph);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0;
    // Name and role in the lower-left corner on a soft backing, so they read over the shoulder.
    ctx.textAlign = 'left';
    ctx.font = '600 30px "Source Sans 3"';
    const nameW = ctx.measureText(portrait.name).width;
    ctx.font = 'italic 600 26px "Source Sans 3"';
    const roleW = portrait.role ? ctx.measureText(portrait.role).width : 0;
    const bw = Math.max(nameW, roleW) + 40, bh = portrait.role ? 92 : 56;
    const bx = 24, by = SIZE - 24 - bh;
    ctx.fillStyle = p.light ? 'rgba(255,255,255,0.78)' : 'rgba(10,10,12,0.7)';
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 10); ctx.fill();
    ctx.font = '600 30px "Source Sans 3"'; ctx.fillStyle = p.text;
    ctx.fillText(portrait.name, bx + 20, by + 40);
    if (portrait.role) { ctx.font = 'italic 600 26px "Source Sans 3"'; ctx.fillStyle = p.soft; ctx.fillText(portrait.role, bx + 20, by + 74); }
  }

  // Date and time: "7TH – 9TH OCT.  |  6PM", centred in the space right of the portrait
  const when = [text.date, text.time].filter(Boolean).join('   |   ').toUpperCase();
  ctx.textAlign = 'center';
  ctx.font = '78px "Bebas Neue"'; ctx.fillStyle = p.text;
  const whenW = ctx.measureText(when).width;
  const whenCx = portrait ? Math.max(cx, portraitRight + 30 + whenW / 2) : cx;
  ctx.shadowColor = p.light ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 12;
  ctx.fillText(when, Math.min(whenCx, SIZE - 40 - whenW / 2), dateBaseline);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

  // Address block bottom-right
  const lines2 = (text.lines ?? []).filter(Boolean);
  if (lines2.length) {
    ctx.textAlign = 'right';
    ctx.font = '600 34px "Source Sans 3"'; ctx.fillStyle = p.text;
    ctx.shadowColor = p.light ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10;
    const step = 44;
    const top = SIZE - 56 - step * (lines2.length - 1);
    lines2.forEach((l, i) => ctx.fillText(l, SIZE - 56, top + step * i));
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  }

  return new Uint8Array(canvas.toBuffer('image/png'));
}

/** Centered text with letter spacing (canvas has no letter-spacing on all platforms). */
function drawTracked(ctx: SKRSContext2D, text: string, cx: number, y: number, tracking: number) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  let x = cx - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => { ctx.fillText(c, x, y); x += widths[i] + tracking; });
  ctx.textAlign = prevAlign;
}
