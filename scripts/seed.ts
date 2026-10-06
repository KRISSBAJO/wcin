// Loads the starter events, messages and settings from src/data/site.ts into the database.
// Only fills tables that are empty, so it is safe to run on an existing database. Usage: pnpm db:seed
import { createClient } from '@libsql/client';
import { events, leaders, messages, ministries, propheticFocus, site } from '../src/data/site.ts';

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}
const client = createClient({ url, authToken });
const now = new Date().toISOString();

async function count(table: string) {
  const r = await client.execute(`SELECT COUNT(*) AS n FROM ${table}`);
  return Number(r.rows[0].n);
}

if ((await count('events')) === 0) {
  for (const e of events) {
    await client.execute({
      sql: 'INSERT INTO events (title, detail, starts_on, ends_on, published, created_at) VALUES (?, ?, ?, ?, 1, ?)',
      args: [e.title, e.detail, e.date, e.endDate ?? null, now],
    });
  }
  console.log(`Seeded ${events.length} events.`);
} else console.log('Events already present, skipped.');

if ((await count('messages')) === 0) {
  for (const m of messages) {
    await client.execute({
      sql: 'INSERT INTO messages (title, speaker, preached_on, length, video_url, published, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
      args: [m.title, m.speaker, m.date, m.length, m.href, now],
    });
  }
  console.log(`Seeded ${messages.length} messages.`);
} else console.log('Messages already present, skipped.');

if ((await count('services')) === 0) {
  let i = 0;
  for (const s of site.services) {
    await client.execute({
      sql: 'INSERT INTO services (day, start_time, end_time, label, note, sort, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
      args: [s.day, s.start, s.end ?? '', s.label, s.note, i++, now],
    });
  }
  console.log(`Seeded ${site.services.length} service times.`);
} else console.log('Services already present, skipped.');

if ((await count('ministries')) === 0) {
  let i = 0;
  for (const m of ministries) {
    await client.execute({
      sql: 'INSERT INTO ministries (slug, tag, title, summary, body, photo_url, photo_key, dark, sort, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)',
      args: [m.id, m.tag, m.title, m.text, m.body, '', '', m.dark ? 1 : 0, i++, now],
    });
  }
  console.log(`Seeded ${ministries.length} ministries.`);
} else console.log('Ministries already present, skipped.');

if ((await count('leaders')) === 0) {
  let i = 0;
  for (const l of leaders) {
    await client.execute({ sql: 'INSERT INTO leaders (name, role, bio, photo_url, photo_key, sort, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)', args: [l.name, l.role, l.bio, '', '', i++, now] });
  }
  console.log(`Seeded ${leaders.length} leaders.`);
} else console.log('Leaders already present, skipped.');

if ((await count('settings')) === 0) {
  const settings: Record<string, string> = {
    announcement_text: site.announcement.text,
    announcement_link_text: site.announcement.linkText,
    announcement_href: site.announcement.href,
    focus_month: propheticFocus.month,
    focus_text: propheticFocus.text,
    focus_scripture: propheticFocus.scripture,
    focus_pdf: propheticFocus.pdf,
    live_stream_url: site.liveStreamUrl,
  };
  for (const [key, value] of Object.entries(settings)) {
    await client.execute({ sql: 'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)', args: [key, value, now] });
  }
  console.log('Seeded settings.');
} else console.log('Settings already present, skipped.');
