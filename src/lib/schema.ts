// Database schema. Each statement is safe to run more than once.
export const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'editor',
    password_hash TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    token_hash TEXT NOT NULL DEFAULT '',
    token_purpose TEXT NOT NULL DEFAULT '',
    token_expires TEXT NOT NULL DEFAULT '',
    last_login_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    payload TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'new',
    ip TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS submissions_status_created ON submissions (status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS submissions_type_created ON submissions (type, created_at DESC)`,

  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    starts_on TEXT NOT NULL,
    ends_on TEXT,
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS events_starts_on ON events (starts_on)`,

  `CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    speaker TEXT NOT NULL DEFAULT '',
    preached_on TEXT NOT NULL,
    length TEXT NOT NULL DEFAULT '',
    video_url TEXT NOT NULL DEFAULT '',
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS messages_preached_on ON messages (preached_on DESC)`,

  `CREATE TABLE IF NOT EXISTS hero_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT NOT NULL,
    image_key TEXT NOT NULL DEFAULT '',
    headline TEXT NOT NULL DEFAULT '',
    link_url TEXT NOT NULL DEFAULT '',
    starts_on TEXT,
    ends_on TEXT,
    sort INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL DEFAULT '',
    label TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS leaders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    photo_url TEXT NOT NULL DEFAULT '',
    photo_key TEXT NOT NULL DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS ministries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    tag TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    photo_url TEXT NOT NULL DEFAULT '',
    photo_key TEXT NOT NULL DEFAULT '',
    dark INTEGER NOT NULL DEFAULT 0,
    sort INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
  )`,
];

// Columns added after the first release. Each is skipped if it already exists.
export const COLUMN_ADDITIONS: { table: string; column: string; sql: string }[] = [
  { table: 'hero_slides', column: 'service_id', sql: 'ALTER TABLE hero_slides ADD COLUMN service_id INTEGER' },
  // Special flyers: tied to a service day and a specific date; expire 12 hours after that service.
  { table: 'hero_slides', column: 'service_day', sql: "ALTER TABLE hero_slides ADD COLUMN service_day TEXT NOT NULL DEFAULT ''" },
  { table: 'hero_slides', column: 'service_date', sql: "ALTER TABLE hero_slides ADD COLUMN service_date TEXT NOT NULL DEFAULT ''" },
  { table: 'hero_slides', column: 'expires_at', sql: "ALTER TABLE hero_slides ADD COLUMN expires_at TEXT NOT NULL DEFAULT ''" },
  // Multi-day specials (e.g. Week of Spiritual Emphasis, Wednesday to Friday): the last day, when it runs past one day.
  { table: 'hero_slides', column: 'end_date', sql: "ALTER TABLE hero_slides ADD COLUMN end_date TEXT NOT NULL DEFAULT ''" },
  // Optional: keep the flyer on the homepage past the usual 12 hours, until the start of this day.
  { table: 'hero_slides', column: 'show_until', sql: "ALTER TABLE hero_slides ADD COLUMN show_until TEXT NOT NULL DEFAULT ''" },
  // Optional flyer per event, shown on the Events page and the homepage cards.
  { table: 'events', column: 'image_url', sql: "ALTER TABLE events ADD COLUMN image_url TEXT NOT NULL DEFAULT ''" },
  { table: 'events', column: 'image_key', sql: "ALTER TABLE events ADD COLUMN image_key TEXT NOT NULL DEFAULT ''" },
  // Message summaries for the Watch page (written by hand or drafted with AI).
  { table: 'messages', column: 'description', sql: "ALTER TABLE messages ADD COLUMN description TEXT NOT NULL DEFAULT ''" },
  { table: 'messages', column: 'points', sql: "ALTER TABLE messages ADD COLUMN points TEXT NOT NULL DEFAULT ''" },
  // A cut-out photo (transparent PNG) per leader, so generated flyers can include them.
  { table: 'leaders', column: 'cutout_url', sql: "ALTER TABLE leaders ADD COLUMN cutout_url TEXT NOT NULL DEFAULT ''" },
  { table: 'leaders', column: 'cutout_key', sql: "ALTER TABLE leaders ADD COLUMN cutout_key TEXT NOT NULL DEFAULT ''" },
  // Each service's permanent fallback flyer, shown whenever no special flyer is live.
  { table: 'services', column: 'default_image', sql: "ALTER TABLE services ADD COLUMN default_image TEXT NOT NULL DEFAULT ''" },
  { table: 'services', column: 'default_image_key', sql: "ALTER TABLE services ADD COLUMN default_image_key TEXT NOT NULL DEFAULT ''" },
];

/** Starter fallback flyers by service day (files in public/hero). */
export const DEFAULT_FLYERS: Record<string, string> = {
  Sunday: '/hero/sunday-service-v3.svg',
  Wednesday: '/hero/midweek-service-v2.svg',
  'Monday to Friday': '/hero/covenant-hour-v3.svg',
};

export const SETTING_KEYS = [
  'announcement_text',
  'announcement_link_text',
  'announcement_href',
  'focus_month',
  'focus_text',
  'focus_scripture',
  'focus_pdf',
  'live_stream_url',
  'welcome_title',
  'welcome_text',
  'hero_video_url',
  'hero_video_key',
  'hero_video_poster_url',
  'hero_video_poster_key',
  'photo_focus_url',
  'photo_focus_key',
  'photo_mandate_url',
  'photo_mandate_key',
  'photo_about_url',
  'photo_about_key',
  'photo_nations_url',
  'photo_nations_key',
  'youtube_source',
  'youtube_speaker',
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];
