'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { checkPassword } from '@/lib/session';
import { clearSession, issueSession, requireAdmin, requireManager, siteOrigin } from '@/lib/auth';
import { MIN_PASSWORD, activeAdminCount, countUsers, createInvitedUser, findByEmail, findByToken, getUser, getUserRow, hashPassword, isRole, issueToken, normalizeEmail, setPassword, touchLogin, verifyPassword, type Role } from '@/lib/users';
import { sendMail } from '@/lib/notify';
import { durationToLength, listVideos, sourceUrl, summarise, tidyTitle, videoDetails } from '@/lib/youtube';
import { youtubeId } from '@/lib/dates';
import { run, nowIso } from '@/lib/db';
import { clearServicesCache, expiryFor, getServices, saveSettings as persistSettings } from '@/lib/content';
import { SETTING_KEYS } from '@/lib/schema';
import { bool, int, isoDate, str } from '@/lib/admin';
import { dateMatchesDay, endAfterStart, endNotBeforeStart, firstError, notInFuture, notInPast, validClock, validHttpUrl, validLink } from '@/lib/validate';
import { centralToIso, longDate } from '@/lib/dates';
import { fetchImage, removeImage, storeBytes, storeImage, storeVideo, UploadError } from '@/lib/storage';
import { openaiConfigured, removeBackground } from '@/lib/openai';
import { PHOTO_SLOTS, type PhotoSlot } from '@/lib/photos';
import { all, one } from '@/lib/db';

/** Public pages re-render on the next request after any admin change. */
function refreshSite() {
  revalidatePath('/', 'layout');
}

function back(path: string, msg: { ok?: string; error?: string }, keep: Record<string, string> = {}) {
  const q = new URLSearchParams();
  if (msg.ok) q.set('ok', msg.ok);
  if (msg.error) q.set('error', msg.error);
  // Form values to put back after an error, so nothing typed (or generated) is lost.
  for (const [k, v] of Object.entries(keep)) if (v) q.set(k, v);
  redirect(`${path}?${q}`);
}

/** The special-flyer form's values, so an error can send them back to the form. */
function slideKeep(data: FormData): Record<string, string> {
  return {
    service_day: str(data, 'service_day', 40),
    service_date: isoDate(data, 'service_date'),
    end_date: isoDate(data, 'end_date'),
    show_until: isoDate(data, 'show_until'),
    headline: str(data, 'headline', 160),
    link_url: str(data, 'link_url', 500),
    generated_key: str(data, 'generated_key', 300),
    generated_url: str(data, 'generated_url', 500),
  };
}

// ---- Auth ----

const LOGIN_DELAY = 350; // slows down guessing

export async function login(formData: FormData) {
  const email = normalizeEmail(str(formData, 'email', 200));
  const password = str(formData, 'password', 200);
  const nextParam = str(formData, 'next', 300);
  const next = nextParam.startsWith('/admin') ? nextParam : '/admin';
  await new Promise((r) => setTimeout(r, LOGIN_DELAY));
  const user = email ? await findByEmail(email) : null;
  const ok = user && user.active && user.password_hash && (await verifyPassword(password, user.password_hash));
  if (!ok) redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  await touchLogin(user!.id);
  await issueSession(user!.id, user!.role);
  redirect(next);
}

/** First run only: turns the .env admin password into the first real admin account. */
export async function createFirstAdmin(formData: FormData) {
  if ((await countUsers()) > 0) redirect('/admin/login');
  const name = str(formData, 'name', 120);
  const email = normalizeEmail(str(formData, 'email', 200));
  const password = str(formData, 'password', 200);
  const setup = str(formData, 'setup', 200);
  await new Promise((r) => setTimeout(r, LOGIN_DELAY));
  const fail = (msg: string) => redirect(`/admin/login?setup_error=${encodeURIComponent(msg)}`);
  if (!checkPassword(setup)) fail('The current admin password from .env is not right.');
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Give your name and a valid email address.');
  if (password.length < MIN_PASSWORD) fail(`Choose a password of at least ${MIN_PASSWORD} characters.`);
  await run(
    'INSERT INTO users (name, email, role, password_hash, active, token_hash, token_purpose, token_expires, last_login_at, created_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?)',
    [name, email, 'admin', await hashPassword(password), '', '', '', nowIso(), nowIso()],
  );
  const user = await findByEmail(email);
  await issueSession(user!.id, 'admin');
  redirect('/admin?ok=' + encodeURIComponent('Welcome. Your admin account is set up; the .env password is no longer used to sign in.'));
}

export async function logout() {
  await clearSession();
  redirect('/admin/login');
}

export async function requestReset(formData: FormData) {
  const email = normalizeEmail(str(formData, 'email', 200));
  await new Promise((r) => setTimeout(r, LOGIN_DELAY));
  const user = email ? await findByEmail(email) : null;
  if (user && user.active && user.password_hash) {
    const token = await issueToken(user.id, 'reset', 1);
    const link = `${await siteOrigin()}/admin/reset/${token}`;
    const sent = await sendMail(user.email, 'Reset your WCI Nashville admin password', `Hello ${user.name},\n\nUse this link within the next hour to choose a new password:\n${link}\n\nIf you did not ask for this, you can ignore it.`);
    if (!sent) console.error('[users] reset link (mail not configured):', link);
  }
  // Same answer whether or not the address exists, so the form cannot be used to list accounts.
  redirect('/admin/forgot?sent=1');
}

export async function resetPassword(formData: FormData) {
  const token = str(formData, 'token', 200);
  const password = str(formData, 'password', 200);
  const confirm = str(formData, 'confirm', 200);
  const user = await findByToken(token, 'reset');
  if (!user) redirect('/admin/forgot?expired=1');
  if (password.length < MIN_PASSWORD) redirect(`/admin/reset/${token}?error=${encodeURIComponent(`Choose a password of at least ${MIN_PASSWORD} characters.`)}`);
  if (password !== confirm) redirect(`/admin/reset/${token}?error=${encodeURIComponent('The two passwords do not match.')}`);
  await setPassword(user!.id, password);
  await touchLogin(user!.id);
  await issueSession(user!.id, user!.role);
  redirect('/admin?ok=' + encodeURIComponent('Your password is updated and you are signed in.'));
}

export async function acceptInvite(formData: FormData) {
  const token = str(formData, 'token', 200);
  const password = str(formData, 'password', 200);
  const confirm = str(formData, 'confirm', 200);
  const user = await findByToken(token, 'invite');
  if (!user) redirect('/admin/login?error=invite');
  if (password.length < MIN_PASSWORD) redirect(`/admin/invite/${token}?error=${encodeURIComponent(`Choose a password of at least ${MIN_PASSWORD} characters.`)}`);
  if (password !== confirm) redirect(`/admin/invite/${token}?error=${encodeURIComponent('The two passwords do not match.')}`);
  await setPassword(user!.id, password);
  await touchLogin(user!.id);
  await issueSession(user!.id, user!.role);
  redirect('/admin?ok=' + encodeURIComponent(`Welcome, ${user!.name}. Your account is ready.`));
}

// ---- Users (admins only) ----

async function inviteMail(name: string, email: string, token: string, invitedBy: string): Promise<{ sent: boolean; link: string }> {
  const link = `${await siteOrigin()}/admin/invite/${token}`;
  const sent = await sendMail(email, 'You are invited to manage the WCI Nashville website', `Hello ${name},\n\n${invitedBy} has given you access to the Winners Chapel International Nashville website admin.\n\nChoose your password here (the link works for 7 days):\n${link}\n\nAfter that, sign in at ${await siteOrigin()}/admin/login with this email address.`);
  return { sent, link };
}

export async function addUser(formData: FormData) {
  const me = await requireManager();
  const name = str(formData, 'name', 120);
  const email = normalizeEmail(str(formData, 'email', 200));
  const role = str(formData, 'role', 20);
  if (!name) back('/admin/users/new', { error: 'Name is required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) back('/admin/users/new', { error: 'That email address does not look right.' });
  if (!isRole(role)) back('/admin/users/new', { error: 'Pick a role.' });
  if (await findByEmail(email)) back('/admin/users/new', { error: `${email} already has an account.` });
  const { id, token } = await createInvitedUser(name, email, role as Role);
  const { sent, link } = await inviteMail(name, email, token, me.name);
  back(`/admin/users/${id}`, sent
    ? { ok: `${name} is invited. An email with the link to set a password went to ${email}.` }
    : { ok: `${name} is added. Email is not set up on the server, so send them this link yourself: ${link}` });
}

export async function updateUser(id: number, formData: FormData) {
  const me = await requireManager();
  const target = await getUser(id);
  if (!target) redirect('/admin/users');
  const name = str(formData, 'name', 120);
  const role = str(formData, 'role', 20);
  const active = bool(formData, 'active');
  if (!name) back(`/admin/users/${id}`, { error: 'Name is required.' });
  if (!isRole(role)) back(`/admin/users/${id}`, { error: 'Pick a role.' });
  // Never lock everyone out: the last working admin stays an active admin.
  const losingAdmin = target.role === 'admin' && target.has_password && (role !== 'admin' || !active);
  if (losingAdmin && (await activeAdminCount(id)) === 0) back(`/admin/users/${id}`, { error: 'This is the only admin who can sign in. Make someone else an admin first.' });
  await run('UPDATE users SET name = ?, role = ?, active = ? WHERE id = ?', [name, role, active, id]);
  if (id === me.id) await issueSession(me.id, role as Role);
  back('/admin/users', { ok: `${name} saved.` });
}

export async function resendInvite(id: number) {
  const me = await requireManager();
  const target = await getUser(id);
  if (!target) redirect('/admin/users');
  if (target.has_password) back(`/admin/users/${id}`, { error: `${target.name} already has a password. They can use "Forgot password" on the sign-in page.` });
  const token = await issueToken(id, 'invite', 7 * 24);
  const { sent, link } = await inviteMail(target.name, target.email, token, me.name);
  back(`/admin/users/${id}`, sent ? { ok: `A fresh invite went to ${target.email}.` } : { ok: `Email is not set up on the server. Send ${target.name} this link: ${link}` });
}

export async function deleteUser(id: number) {
  const me = await requireManager();
  if (id === me.id) back(`/admin/users/${id}`, { error: 'You cannot delete your own account while signed in to it.' });
  const target = await getUser(id);
  if (!target) redirect('/admin/users');
  if (target.role === 'admin' && target.has_password && (await activeAdminCount(id)) === 0) back(`/admin/users/${id}`, { error: 'This is the only admin who can sign in. Make someone else an admin first.' });
  await run('DELETE FROM users WHERE id = ?', [id]);
  back('/admin/users', { ok: `${target.name} removed.` });
}

/** The signed-in person's own name and password. */
export async function updateAccount(formData: FormData) {
  const me = await requireAdmin();
  const name = str(formData, 'name', 120);
  const current = str(formData, 'current', 200);
  const password = str(formData, 'password', 200);
  const confirm = str(formData, 'confirm', 200);
  if (!name) back('/admin/account', { error: 'Name is required.' });
  if (password || confirm) {
    const row = await getUserRow(me.id);
    if (!row || !(await verifyPassword(current, row.password_hash))) back('/admin/account', { error: 'Your current password is not right.' });
    if (password.length < MIN_PASSWORD) back('/admin/account', { error: `Choose a password of at least ${MIN_PASSWORD} characters.` });
    if (password !== confirm) back('/admin/account', { error: 'The two new passwords do not match.' });
    await setPassword(me.id, password);
  }
  await run('UPDATE users SET name = ? WHERE id = ?', [name, me.id]);
  back('/admin/account', { ok: password ? 'Name and password saved.' : 'Name saved.' });
}

// ---- Submissions ----

export async function setSubmissionStatus(id: number, status: 'new' | 'read' | 'archived') {
  await requireAdmin();
  await run('UPDATE submissions SET status = ? WHERE id = ?', [status, id]);
  redirect(`/admin/submissions/${id}`);
}

export async function deleteSubmission(id: number) {
  await requireAdmin();
  await run('DELETE FROM submissions WHERE id = ?', [id]);
  back('/admin/inbox', { ok: 'Submission deleted.' });
}

// ---- YouTube ----

/**
 * Pulls the latest videos from the channel or playlist set under Settings into Messages.
 * Videos already present are left alone; the four starter placeholders are removed the first time.
 */
export async function syncYouTube() {
  await requireAdmin();
  const settings = await getSettingsFresh();
  const url = sourceUrl(settings.youtube_source);
  let listing;
  try {
    listing = await listVideos(url, 12);
  } catch (err) {
    back('/admin/messages', { error: `Could not read YouTube: ${(err as Error).message}` });
    return;
  }
  if (listing.length === 0) back('/admin/messages', { error: 'No videos found at that address. Check the YouTube source under Settings.' });
  const existing = await all<{ id: number; video_url: string }>('SELECT id, video_url FROM messages');
  const have = new Set(existing.map((m) => youtubeId(m.video_url)).filter(Boolean));
  let added = 0;
  for (const v of listing) {
    if (have.has(v.id)) continue;
    let details;
    try { details = await videoDetails(v.id); } catch { continue; }
    if (!details.uploadDate) continue;
    await run(
      'INSERT INTO messages (title, speaker, preached_on, length, video_url, description, points, published, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)',
      [tidyTitle(details.title || v.title), settings.youtube_speaker, details.uploadDate, durationToLength(v.duration), `https://www.youtube.com/watch?v=${v.id}`, summarise(details.description), '', nowIso()],
    );
    added++;
  }
  // The starter entries shipped with the site point at youtube.com itself; real videos replace them.
  const placeholders = existing.filter((m) => /^https?:\/\/(www\.)?youtube\.com\/?$/.test(m.video_url));
  for (const m of placeholders) await run('DELETE FROM messages WHERE id = ?', [m.id]);
  refreshSite();
  back('/admin/messages', { ok: `${added} new video${added === 1 ? '' : 's'} added from YouTube${placeholders.length ? `, ${placeholders.length} starter placeholder${placeholders.length === 1 ? '' : 's'} removed` : ''}. Hide any you do not want on the site from the list below.` });
}

// ---- Hero slides ----

/** Reads the special-flyer fields and works out when it expires. Returns an error message when invalid. */
async function slideFields(data: FormData, selfId = 0): Promise<{ ok: true; f: { headline: string; link_url: string; active: number; service_day: string; service_date: string; end_date: string; show_until: string; expires_at: string; retire: number[] } } | { ok: false; error: string }> {
  const service_day = str(data, 'service_day', 40);
  const service_date = isoDate(data, 'service_date');
  const end_date = isoDate(data, 'end_date');
  const show_until = isoDate(data, 'show_until');
  if (!service_day || !service_date) return { ok: false, error: 'Pick the service and the date of that service.' };
  if (show_until && show_until <= (end_date || service_date)) return { ok: false, error: '"Keep showing until" must be after the service date. Leave it empty to use the usual 12 hours.' };
  if (end_date && end_date < service_date) return { ok: false, error: 'The last day cannot be before the first day.' };
  if (end_date && end_date > service_date) {
    const span = Math.round((Date.parse(end_date) - Date.parse(service_date)) / 86_400_000);
    if (span > 13) return { ok: false, error: 'A special can run for up to two weeks. For longer programmes add one flyer per week.' };
  }
  const dayServices = (await getServices(true)).filter((s) => s.day === service_day);
  if (dayServices.length === 0) return { ok: false, error: 'That service is not active. Add it under Services first.' };
  const link_url = str(data, 'link_url', 500);
  const active = bool(data, 'active');
  const replaceLive = bool(data, 'replace_live');
  let retire: number[] = [];
  const basic = firstError(
    notInPast(service_date, 'The service date'),
    dateMatchesDay(service_day, service_date),
    validLink(link_url),
  );
  if (basic) return { ok: false, error: basic };
  if (active) {
    // One live special flyer per service day at a time.
    const clashes = await all<{ id: number; service_date: string; headline: string }>(
      'SELECT id, service_date, headline FROM hero_slides WHERE active = 1 AND service_day = ? AND expires_at > ? AND id != ? ORDER BY service_date ASC',
      [service_day, nowIso(), selfId],
    );
    const clash = clashes[0];
    if (clash && replaceLive) {
      retire = clashes.map((c) => c.id);
    } else if (clash) {
      return { ok: false, error: `There is already a live ${service_day} flyer (${clash.headline || 'untitled'}, ${longDate(clash.service_date)}). Only one can be live per service day. Tick "Replace the live flyer for that day" below to retire it and use this one, or untick Active to save this one for later.` };
    }
  }
  return {
    ok: true,
    f: {
      headline: str(data, 'headline', 160),
      link_url,
      active,
      service_day,
      service_date,
      end_date: end_date && end_date > service_date ? end_date : '',
      show_until,
      // Leaves the homepage 12 hours after the (last) service, or at the start of the "keep showing until" day.
      expires_at: show_until ? centralToIso(show_until, 0) : expiryFor(end_date && end_date > service_date ? end_date : service_date, dayServices),
      retire,
    },
  };
}

export async function addSlide(formData: FormData) {
  await requireAdmin();
  const parsed = await slideFields(formData);
  if (!parsed.ok) back('/admin/hero/new', { error: parsed.error }, slideKeep(formData));
  const { f } = parsed as Extract<Awaited<ReturnType<typeof slideFields>>, { ok: true }>;
  const file = formData.get('image');
  const generatedKey = str(formData, 'generated_key', 300);
  const generatedUrl = str(formData, 'generated_url', 500);
  let stored: { key: string; url: string };
  if (generatedKey.startsWith('hero/drafts/') && generatedUrl) {
    // A flyer made with "Generate with AI" in this form; already stored.
    stored = { key: generatedKey, url: generatedUrl };
  } else {
    try {
      if (!(file instanceof File) || file.size === 0) throw new UploadError('Choose an image to upload, or generate one.');
      stored = await storeImage(file, 'hero');
    } catch (err) {
      console.error('[admin/hero]', err);
      back('/admin/hero/new', { error: err instanceof UploadError ? err.message : `Upload failed: ${(err as Error).message}` }, slideKeep(formData));
      return;
    }
  }
  for (const id of f.retire) await run('UPDATE hero_slides SET active = 0 WHERE id = ?', [id]);
  await run(
    'INSERT INTO hero_slides (image_url, image_key, headline, link_url, sort, active, service_day, service_date, end_date, show_until, expires_at, created_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)',
    [stored.url, stored.key, f.headline, f.link_url, f.active, f.service_day, f.service_date, f.end_date, f.show_until, f.expires_at, nowIso()],
  );
  refreshSite();
  const live = f.active && f.expires_at > nowIso();
  back('/admin/hero', { ok: live ? `Flyer added.${f.retire.length ? ` The previous live ${f.retire.length === 1 ? 'flyer was' : 'flyers were'} retired (kept in the list, inactive).` : ''} It replaces the ${f.service_day} flyer ${f.show_until ? `until ${longDate(f.show_until)}` : `until 12 hours after ${f.end_date ? `the last day, ${longDate(f.end_date)}` : longDate(f.service_date)}`}.` : 'Flyer saved (not showing: inactive or already past).' });
}

export async function updateSlide(id: number, formData: FormData) {
  await requireAdmin();
  const existing = await one<{ image_url: string; image_key: string }>('SELECT image_url, image_key FROM hero_slides WHERE id = ?', [id]);
  if (!existing) redirect('/admin/hero');
  const parsed = await slideFields(formData, id);
  if (!parsed.ok) back(`/admin/hero/${id}`, { error: parsed.error });
  const { f } = parsed as Extract<Awaited<ReturnType<typeof slideFields>>, { ok: true }>;
  let imageUrl = existing.image_url;
  let imageKey = existing.image_key;
  const file = formData.get('image');
  if (file instanceof File && file.size > 0) {
    try {
      const stored = await storeImage(file, 'hero');
      await removeImage(existing.image_key);
      imageUrl = stored.url;
      imageKey = stored.key;
    } catch (err) {
      back(`/admin/hero/${id}`, { error: err instanceof UploadError ? err.message : `Upload failed: ${(err as Error).message}` });
      return;
    }
  }
  for (const rid of f.retire) await run('UPDATE hero_slides SET active = 0 WHERE id = ?', [rid]);
  await run(
    'UPDATE hero_slides SET image_url = ?, image_key = ?, headline = ?, link_url = ?, active = ?, service_day = ?, service_date = ?, end_date = ?, show_until = ?, expires_at = ? WHERE id = ?',
    [imageUrl, imageKey, f.headline, f.link_url, f.active, f.service_day, f.service_date, f.end_date, f.show_until, f.expires_at, id],
  );
  refreshSite();
  back('/admin/hero', { ok: 'Saved.' });
}

export async function deleteSlide(id: number) {
  await requireAdmin();
  const existing = await one<{ image_key: string }>('SELECT image_key FROM hero_slides WHERE id = ?', [id]);
  await run('DELETE FROM hero_slides WHERE id = ?', [id]);
  if (existing) await removeImage(existing.image_key);
  refreshSite();
  back('/admin/hero', { ok: 'Slide deleted.' });
}

// ---- Services ----

function serviceFields(data: FormData) {
  return {
    day: str(data, 'day', 40),
    start_time: str(data, 'start_time', 20),
    end_time: str(data, 'end_time', 20),
    label: str(data, 'label', 80),
    note: str(data, 'note', 120),
    sort: int(data, 'sort'),
    active: bool(data, 'active'),
  };
}

/** Optional fallback-flyer upload on a service form. Returns null when no file was chosen. */
async function flyerUpload(formData: FormData, path: string) {
  const file = formData.get('flyer');
  if (!(file instanceof File) || file.size === 0) return null;
  try {
    return await storeImage(file, 'flyers');
  } catch (err) {
    back(path, { error: err instanceof UploadError ? err.message : `Upload failed: ${(err as Error).message}` });
    return null;
  }
}

async function serviceError(f: ReturnType<typeof serviceFields>, selfId = 0): Promise<string | null> {
  if (!f.day || !f.start_time) return 'Day and start time are required.';
  const basic = firstError(validClock(f.start_time, 'The start time'), validClock(f.end_time, 'The end time'), endAfterStart(f.start_time, f.end_time));
  if (basic) return basic;
  const dup = await one('SELECT id FROM services WHERE day = ? AND lower(start_time) = lower(?) AND id != ?', [f.day, f.start_time, selfId]);
  return dup ? `There is already a ${f.day} service at ${f.start_time}.` : null;
}

export async function addService(formData: FormData) {
  await requireAdmin();
  const f = serviceFields(formData);
  const err = await serviceError(f);
  if (err) back('/admin/services/new', { error: err });
  const flyer = await flyerUpload(formData, '/admin/services/new');
  // A new service on an existing day inherits that day's fallback flyer unless one was uploaded.
  const sibling = flyer ? null : await one<{ default_image: string }>("SELECT default_image FROM services WHERE day = ? AND default_image != '' LIMIT 1", [f.day]);
  await run('INSERT INTO services (day, start_time, end_time, label, note, sort, active, default_image, default_image_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    f.day, f.start_time, f.end_time, f.label, f.note, f.sort, f.active, flyer?.url ?? sibling?.default_image ?? '', flyer?.key ?? '', nowIso(),
  ]);
  clearServicesCache();
  refreshSite();
  back('/admin/services', { ok: 'Service added.' });
}

export async function updateService(id: number, formData: FormData) {
  await requireAdmin();
  const f = serviceFields(formData);
  const err = await serviceError(f, id);
  if (err) back(`/admin/services/${id}`, { error: err });
  const existing = await one<{ default_image: string; default_image_key: string }>('SELECT default_image, default_image_key FROM services WHERE id = ?', [id]);
  if (!existing) redirect('/admin/services');
  const flyer = await flyerUpload(formData, `/admin/services/${id}`);
  let image = existing.default_image;
  let key = existing.default_image_key;
  if (flyer) {
    await removeImage(existing.default_image_key);
    image = flyer.url;
    key = flyer.key;
    // Services on the same day share one fallback flyer.
    await run('UPDATE services SET default_image = ?, default_image_key = ? WHERE day = ? AND id != ?', [image, '', f.day, id]);
  }
  await run('UPDATE services SET day = ?, start_time = ?, end_time = ?, label = ?, note = ?, sort = ?, active = ?, default_image = ?, default_image_key = ? WHERE id = ?', [
    f.day, f.start_time, f.end_time, f.label, f.note, f.sort, f.active, image, key, id,
  ]);
  clearServicesCache();
  refreshSite();
  back('/admin/services', { ok: 'Saved.' });
}

export async function deleteService(id: number) {
  await requireAdmin();
  const existing = await one<{ default_image_key: string }>('SELECT default_image_key FROM services WHERE id = ?', [id]);
  await run('DELETE FROM services WHERE id = ?', [id]);
  if (existing?.default_image_key) await removeImage(existing.default_image_key);
  clearServicesCache();
  refreshSite();
  back('/admin/services', { ok: 'Service deleted.' });
}

// ---- Events ----

function eventFields(data: FormData) {
  return {
    title: str(data, 'title', 200),
    detail: str(data, 'detail', 500),
    starts_on: isoDate(data, 'starts_on'),
    ends_on: isoDate(data, 'ends_on') || null,
    published: bool(data, 'published'),
  };
}

async function eventError(f: ReturnType<typeof eventFields>, selfId = 0, previousStart = ''): Promise<string | null> {
  if (!f.title || !f.starts_on) return 'Title and start date are required.';
  const basic = firstError(
    f.starts_on !== previousStart ? notInPast(f.starts_on, 'The start date') : null,
    endNotBeforeStart(f.starts_on, f.ends_on),
  );
  if (basic) return basic;
  const dup = await one('SELECT id FROM events WHERE lower(title) = lower(?) AND starts_on = ? AND id != ?', [f.title, f.starts_on, selfId]);
  return dup ? `"${f.title}" on ${longDate(f.starts_on)} already exists.` : null;
}

export async function addEvent(formData: FormData) {
  await requireAdmin();
  const f = eventFields(formData);
  const err = await eventError(f);
  if (err) back('/admin/events/new', { error: err });
  const photo = await photoUpload(formData, '/admin/events/new', 'events');
  await run('INSERT INTO events (title, detail, starts_on, ends_on, published, image_url, image_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [f.title, f.detail, f.starts_on, f.ends_on, f.published, photo?.url ?? '', photo?.key ?? '', nowIso()]);
  refreshSite();
  back('/admin/events', { ok: 'Event added.' });
}

export async function updateEvent(id: number, formData: FormData) {
  await requireAdmin();
  const f = eventFields(formData);
  const existing = await one<{ starts_on: string; image_url: string; image_key: string }>('SELECT starts_on, image_url, image_key FROM events WHERE id = ?', [id]);
  if (!existing) redirect('/admin/events');
  const err = await eventError(f, id, existing.starts_on);
  if (err) back(`/admin/events/${id}`, { error: err });
  const photo = await photoUpload(formData, `/admin/events/${id}`, 'events');
  const dropImage = bool(formData, 'remove_image');
  if ((photo || dropImage) && existing.image_key) await removeImage(existing.image_key);
  const imageUrl = photo?.url ?? (dropImage ? '' : existing.image_url);
  const imageKey = photo?.key ?? (dropImage ? '' : existing.image_key);
  await run('UPDATE events SET title = ?, detail = ?, starts_on = ?, ends_on = ?, published = ?, image_url = ?, image_key = ? WHERE id = ?', [f.title, f.detail, f.starts_on, f.ends_on, f.published, imageUrl, imageKey, id]);
  refreshSite();
  back('/admin/events', { ok: 'Saved.' });
}

export async function deleteEvent(id: number) {
  await requireAdmin();
  const existing = await one<{ image_key: string }>('SELECT image_key FROM events WHERE id = ?', [id]);
  await run('DELETE FROM events WHERE id = ?', [id]);
  if (existing?.image_key) await removeImage(existing.image_key);
  refreshSite();
  back('/admin/events', { ok: 'Event deleted.' });
}

// ---- Messages ----

function messageFields(data: FormData) {
  return {
    title: str(data, 'title', 200),
    speaker: str(data, 'speaker', 120),
    preached_on: isoDate(data, 'preached_on'),
    length: str(data, 'length', 30),
    video_url: str(data, 'video_url', 500),
    description: str(data, 'description', 300),
    points: str(data, 'points', 600),
    published: bool(data, 'published'),
  };
}

async function messageError(f: ReturnType<typeof messageFields>, selfId = 0): Promise<string | null> {
  if (!f.title || !f.preached_on) return 'Title and date are required.';
  const basic = firstError(notInFuture(f.preached_on, 'The date preached'), validHttpUrl(f.video_url, 'The video link'));
  if (basic) return basic;
  const dup = await one('SELECT id FROM messages WHERE lower(title) = lower(?) AND preached_on = ? AND id != ?', [f.title, f.preached_on, selfId]);
  return dup ? `"${f.title}" on ${longDate(f.preached_on)} already exists.` : null;
}

export async function addMessage(formData: FormData) {
  await requireAdmin();
  const f = messageFields(formData);
  const err = await messageError(f);
  if (err) back('/admin/messages/new', { error: err });
  await run('INSERT INTO messages (title, speaker, preached_on, length, video_url, description, points, published, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [f.title, f.speaker, f.preached_on, f.length, f.video_url, f.description, f.points, f.published, nowIso()]);
  refreshSite();
  back('/admin/messages', { ok: 'Message added.' });
}

export async function updateMessage(id: number, formData: FormData) {
  await requireAdmin();
  const f = messageFields(formData);
  const err = await messageError(f, id);
  if (err) back(`/admin/messages/${id}`, { error: err });
  await run('UPDATE messages SET title = ?, speaker = ?, preached_on = ?, length = ?, video_url = ?, description = ?, points = ?, published = ? WHERE id = ?', [f.title, f.speaker, f.preached_on, f.length, f.video_url, f.description, f.points, f.published, id]);
  refreshSite();
  back('/admin/messages', { ok: 'Saved.' });
}

export async function deleteMessage(id: number) {
  await requireAdmin();
  await run('DELETE FROM messages WHERE id = ?', [id]);
  refreshSite();
  back('/admin/messages', { ok: 'Message deleted.' });
}

// ---- Ministries ----

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'ministry';
}

function ministryFields(data: FormData) {
  const title = str(data, 'title', 80);
  return {
    title,
    slug: slugify(str(data, 'slug', 40) || title),
    tag: str(data, 'tag', 30),
    summary: str(data, 'summary', 200),
    body: str(data, 'body', 2000),
    dark: bool(data, 'dark'),
    sort: int(data, 'sort'),
    active: bool(data, 'active'),
  };
}

export async function addMinistry(formData: FormData) {
  await requireAdmin();
  const f = ministryFields(formData);
  if (!f.title) back('/admin/ministries/new', { error: 'Name is required.' });
  const taken = await one('SELECT id FROM ministries WHERE slug = ? OR lower(title) = lower(?)', [f.slug, f.title]);
  if (taken) back('/admin/ministries/new', { error: `A ministry called "${f.title}" (or with the link name "${f.slug}") already exists.` });
  const photo = await photoUpload(formData, '/admin/ministries/new', 'ministries');
  await run('INSERT INTO ministries (slug, tag, title, summary, body, photo_url, photo_key, dark, sort, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    f.slug, f.tag, f.title, f.summary, f.body, photo?.url ?? '', photo?.key ?? '', f.dark, f.sort, f.active, nowIso(),
  ]);
  refreshSite();
  back('/admin/ministries', { ok: 'Ministry added.' });
}

export async function updateMinistry(id: number, formData: FormData) {
  await requireAdmin();
  const f = ministryFields(formData);
  if (!f.title) back(`/admin/ministries/${id}`, { error: 'Name is required.' });
  const existing = await one<{ photo_url: string; photo_key: string }>('SELECT photo_url, photo_key FROM ministries WHERE id = ?', [id]);
  if (!existing) redirect('/admin/ministries');
  const taken = await one('SELECT id FROM ministries WHERE (slug = ? OR lower(title) = lower(?)) AND id != ?', [f.slug, f.title, id]);
  if (taken) back(`/admin/ministries/${id}`, { error: `A ministry called "${f.title}" (or with the link name "${f.slug}") already exists.` });
  const photo = await photoUpload(formData, `/admin/ministries/${id}`, 'ministries');
  if (photo) await removeImage(existing.photo_key);
  await run('UPDATE ministries SET slug = ?, tag = ?, title = ?, summary = ?, body = ?, photo_url = ?, photo_key = ?, dark = ?, sort = ?, active = ? WHERE id = ?', [
    f.slug, f.tag, f.title, f.summary, f.body, photo?.url ?? existing.photo_url, photo?.key ?? existing.photo_key, f.dark, f.sort, f.active, id,
  ]);
  refreshSite();
  back('/admin/ministries', { ok: 'Saved.' });
}

export async function deleteMinistry(id: number) {
  await requireAdmin();
  const existing = await one<{ photo_key: string }>('SELECT photo_key FROM ministries WHERE id = ?', [id]);
  await run('DELETE FROM ministries WHERE id = ?', [id]);
  if (existing?.photo_key) await removeImage(existing.photo_key);
  refreshSite();
  back('/admin/ministries', { ok: 'Ministry removed.' });
}

// ---- Leaders ----

function leaderFields(data: FormData) {
  return { name: str(data, 'name', 120), role: str(data, 'role', 80), bio: str(data, 'bio', 2000), sort: int(data, 'sort'), active: bool(data, 'active') };
}

async function photoUpload(formData: FormData, path: string, folder = 'leaders') {
  const file = formData.get('photo');
  if (!(file instanceof File) || file.size === 0) return null;
  try {
    return await storeImage(file, folder);
  } catch (err) {
    back(path, { error: err instanceof UploadError ? err.message : `Upload failed: ${(err as Error).message}` });
    return null;
  }
}

/** Optional cut-out upload (transparent PNG or WebP) used to place a leader on generated flyers. */
async function cutoutUpload(formData: FormData, path: string) {
  const file = formData.get('cutout');
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.type && !['image/png', 'image/webp'].includes(file.type)) {
    back(path, { error: 'The cut-out must be a PNG or WebP with a transparent background.' });
    return null;
  }
  try {
    return await storeImage(file, 'cutouts');
  } catch (err) {
    back(path, { error: err instanceof UploadError ? err.message : `Upload failed: ${(err as Error).message}` });
    return null;
  }
}

export async function addLeader(formData: FormData) {
  await requireAdmin();
  const f = leaderFields(formData);
  if (!f.name) back('/admin/leaders/new', { error: 'Name is required.' });
  if (await one('SELECT id FROM leaders WHERE lower(name) = lower(?)', [f.name])) back('/admin/leaders/new', { error: `${f.name} is already listed.` });
  const photo = await photoUpload(formData, '/admin/leaders/new');
  let cutout = await cutoutUpload(formData, '/admin/leaders/new');
  let note = '';
  if (!cutout && photo) {
    const auto = await autoCutout(formData.get('photo') as File, f.name);
    cutout = auto.stored;
    note = auto.note;
  }
  await run('INSERT INTO leaders (name, role, bio, photo_url, photo_key, cutout_url, cutout_key, sort, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    f.name, f.role, f.bio, photo?.url ?? '', photo?.key ?? '', cutout?.url ?? '', cutout?.key ?? '', f.sort, f.active, nowIso(),
  ]);
  refreshSite();
  back('/admin/leaders', { ok: `Leader added.${note}` });
}

export async function updateLeader(id: number, formData: FormData) {
  await requireAdmin();
  const f = leaderFields(formData);
  if (!f.name) back(`/admin/leaders/${id}`, { error: 'Name is required.' });
  if (await one('SELECT id FROM leaders WHERE lower(name) = lower(?) AND id != ?', [f.name, id])) back(`/admin/leaders/${id}`, { error: `${f.name} is already listed.` });
  const existing = await one<{ photo_url: string; photo_key: string; cutout_url: string; cutout_key: string }>('SELECT photo_url, photo_key, cutout_url, cutout_key FROM leaders WHERE id = ?', [id]);
  if (!existing) redirect('/admin/leaders');
  const photo = await photoUpload(formData, `/admin/leaders/${id}`);
  if (photo) await removeImage(existing.photo_key);
  let cutout = await cutoutUpload(formData, `/admin/leaders/${id}`);
  let note = '';
  if (!cutout && photo) {
    // A new photo replaces the old cut-out too, so build a fresh one from it.
    const auto = await autoCutout(formData.get('photo') as File, f.name);
    cutout = auto.stored;
    note = auto.note;
  }
  if (cutout) await removeImage(existing.cutout_key);
  await run('UPDATE leaders SET name = ?, role = ?, bio = ?, photo_url = ?, photo_key = ?, cutout_url = ?, cutout_key = ?, sort = ?, active = ? WHERE id = ?', [
    f.name, f.role, f.bio, photo?.url ?? existing.photo_url, photo?.key ?? existing.photo_key, cutout?.url ?? existing.cutout_url, cutout?.key ?? existing.cutout_key, f.sort, f.active, id,
  ]);
  refreshSite();
  back('/admin/leaders', { ok: `Saved.${note}` });
}

/**
 * Builds a transparent cut-out from an uploaded photo with OpenAI, when a key is set.
 * Never blocks the save: if it fails, the leader is stored without a cut-out and the message says so.
 */
async function autoCutout(file: File, who: string): Promise<{ stored: { key: string; url: string } | null; note: string }> {
  if (!openaiConfigured()) return { stored: null, note: '' };
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const png = await removeBackground(bytes, file.type || 'image/jpeg');
    const stored = await storeBytes(png, 'cutouts', `${who}-cutout.png`);
    return { stored, note: ' A flyer cut-out was made from the photo.' };
  } catch (err) {
    console.error('[leaders] automatic cut-out failed:', (err as Error).message);
    return { stored: null, note: ' The automatic cut-out could not be made; you can upload one or try again from the leader page.' };
  }
}

/** Makes (or remakes) the cut-out for a leader who already has a photo. */
export async function makeCutout(id: number) {
  await requireAdmin();
  const l = await one<{ name: string; photo_key: string; cutout_key: string }>('SELECT name, photo_key, cutout_key FROM leaders WHERE id = ?', [id]);
  if (!l) redirect('/admin/leaders');
  if (!l.photo_key) back(`/admin/leaders/${id}`, { error: 'Upload a photo first.' });
  if (!openaiConfigured()) back(`/admin/leaders/${id}`, { error: 'OPENAI_API_KEY is not set, so the cut-out cannot be made automatically.' });
  const src = await fetchImage(l.photo_key);
  if (!src) back(`/admin/leaders/${id}`, { error: 'The photo could not be read from storage.' });
  let stored: { key: string; url: string };
  try {
    const bytes = new Uint8Array(await new Response(src!.body).arrayBuffer());
    const png = await removeBackground(bytes, src!.contentType);
    stored = await storeBytes(png, 'cutouts', `${l.name}-cutout.png`);
  } catch (err) {
    back(`/admin/leaders/${id}`, { error: `Could not make the cut-out: ${(err as Error).message}` });
    return;
  }
  await run('UPDATE leaders SET cutout_url = ?, cutout_key = ? WHERE id = ?', [stored.url, stored.key, id]);
  if (l.cutout_key) await removeImage(l.cutout_key);
  refreshSite();
  back(`/admin/leaders/${id}`, { ok: 'Cut-out made. Check it looks right before using it on a flyer.' });
}

export async function deleteLeader(id: number) {
  await requireAdmin();
  const existing = await one<{ photo_key: string; cutout_key: string }>('SELECT photo_key, cutout_key FROM leaders WHERE id = ?', [id]);
  await run('DELETE FROM leaders WHERE id = ?', [id]);
  if (existing?.photo_key) await removeImage(existing.photo_key);
  if (existing?.cutout_key) await removeImage(existing.cutout_key);
  refreshSite();
  back('/admin/leaders', { ok: 'Leader removed.' });
}

// ---- Settings ----

export async function saveSettings(formData: FormData) {
  await requireManager();
  const patch: Record<string, string> = {};
  // Only the fields this form carries; the hero video has its own form and must not be blanked here.
  for (const key of SETTING_KEYS) if (formData.has(key)) patch[key] = str(formData, key, key === 'welcome_text' ? 1500 : 500);
  const err = firstError(
    validLink(patch.announcement_href, 'The announcement link'),
    validHttpUrl(patch.focus_pdf, 'The prophetic focus PDF link'),
    validHttpUrl(patch.live_stream_url, 'The live stream link'),
    patch.announcement_text && patch.announcement_link_text && !patch.announcement_href ? 'Give the announcement link somewhere to go, or clear the link label.' : null,
  );
  if (err) back('/admin/settings', { error: err });
  await persistSettings(patch);
  refreshSite();
  back('/admin/settings', { ok: 'Saved. The site is updated.' });
}

/** Homepage hero background: a short, silent, looping clip. Replaces the previous one. */
export async function uploadHeroVideo(formData: FormData) {
  await requireManager();
  const file = formData.get('video');
  if (!(file instanceof File) || file.size === 0) back('/admin/settings', { error: 'Choose a video file first.' });
  let stored: { key: string; url: string };
  try {
    stored = await storeVideo(file as File, 'hero/video');
  } catch (err) {
    back('/admin/settings', { error: err instanceof UploadError ? err.message : `Upload failed: ${(err as Error).message}` });
    return;
  }
  const previous = (await getSettingsFresh()).hero_video_key;
  await persistSettings({ hero_video_url: stored.url, hero_video_key: stored.key });
  if (previous) await removeImage(previous);
  refreshSite();
  back('/admin/settings', { ok: 'Hero video uploaded. It plays silently behind the homepage headline.' });
}

export async function uploadSitePhoto(slot: PhotoSlot, formData: FormData) {
  await requireManager();
  if (!(slot in PHOTO_SLOTS)) redirect('/admin/settings');
  const file = formData.get('photo');
  if (!(file instanceof File) || file.size === 0) back('/admin/settings', { error: 'Choose an image first.' });
  let stored: { key: string; url: string };
  try {
    stored = await storeImage(file as File, `site/${slot}`);
  } catch (err) {
    back('/admin/settings', { error: err instanceof UploadError ? err.message : `Upload failed: ${(err as Error).message}` });
    return;
  }
  const previous = (await getSettingsFresh())[`photo_${slot}_key`];
  await persistSettings({ [`photo_${slot}_url`]: stored.url, [`photo_${slot}_key`]: stored.key });
  if (previous) await removeImage(previous);
  refreshSite();
  back('/admin/settings', { ok: `${PHOTO_SLOTS[slot].label} updated.` });
}

export async function removeSitePhoto(slot: PhotoSlot) {
  await requireManager();
  if (!(slot in PHOTO_SLOTS)) redirect('/admin/settings');
  const previous = (await getSettingsFresh())[`photo_${slot}_key`];
  await persistSettings({ [`photo_${slot}_url`]: '', [`photo_${slot}_key`]: '' });
  if (previous) await removeImage(previous);
  refreshSite();
  back('/admin/settings', { ok: `${PHOTO_SLOTS[slot].label} removed.` });
}

/** A still frame shown the instant the page opens, before the video has loaded. */
export async function uploadHeroPoster(formData: FormData) {
  await requireManager();
  const file = formData.get('poster');
  if (!(file instanceof File) || file.size === 0) back('/admin/settings', { error: 'Choose an image first.' });
  let stored: { key: string; url: string };
  try {
    stored = await storeImage(file as File, 'hero/video');
  } catch (err) {
    back('/admin/settings', { error: err instanceof UploadError ? err.message : `Upload failed: ${(err as Error).message}` });
    return;
  }
  const previous = (await getSettingsFresh()).hero_video_poster_key;
  await persistSettings({ hero_video_poster_url: stored.url, hero_video_poster_key: stored.key });
  if (previous) await removeImage(previous);
  refreshSite();
  back('/admin/settings', { ok: 'Poster image saved. It shows until the video starts.' });
}

export async function removeHeroVideo() {
  await requireManager();
  const current = await getSettingsFresh();
  const previous = current.hero_video_key;
  await persistSettings({ hero_video_url: '', hero_video_key: '', hero_video_poster_url: '', hero_video_poster_key: '' });
  if (previous) await removeImage(previous);
  if (current.hero_video_poster_key) await removeImage(current.hero_video_poster_key);
  refreshSite();
  back('/admin/settings', { ok: 'Hero video removed. The homepage is back to the plain dark hero.' });
}

async function getSettingsFresh() {
  const { getSettings } = await import('@/lib/content');
  return getSettings(true);
}
