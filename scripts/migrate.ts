// Creates the tables. Safe to run again. Usage: pnpm db:migrate
import { createClient } from '@libsql/client';
import { SCHEMA, COLUMN_ADDITIONS, DEFAULT_FLYERS } from '../src/lib/schema.ts';

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;
if (!url) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}
if (url.startsWith('libsql://') && !authToken) {
  console.error('DATABASE_AUTH_TOKEN is required for a Turso database.');
  process.exit(1);
}
if (url.startsWith('file:')) {
  const { mkdirSync } = await import('node:fs');
  const { dirname } = await import('node:path');
  mkdirSync(dirname(url.slice(5)), { recursive: true });
}

const client = createClient({ url, authToken });
for (const sql of SCHEMA) await client.execute(sql);
for (const add of COLUMN_ADDITIONS) {
  const cols = await client.execute(`PRAGMA table_info(${add.table})`);
  if (cols.rows.some((r) => r.name === add.column)) continue;
  await client.execute(add.sql);
  console.log(`Added column ${add.table}.${add.column}`);
}
// Services without a fallback flyer get the starter one for their day.
for (const [day, image] of Object.entries(DEFAULT_FLYERS)) {
  const r = await client.execute({ sql: "UPDATE services SET default_image = ? WHERE day = ? AND default_image = ''", args: [image, day] });
  if (r.rowsAffected) console.log(`Set fallback flyer for ${day} (${r.rowsAffected} row(s))`);
}
const tables = await client.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
console.log('Migrated. Tables:', tables.rows.map((r) => r.name).join(', '));
