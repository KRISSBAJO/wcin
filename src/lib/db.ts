import { createClient, type Client, type InValue } from '@libsql/client';
import { env, envRequired } from './env';

let client: Client | null = null;

/** One shared libSQL client. Works with Turso (libsql://) and local files (file:). */
export function db(): Client {
  if (client) return client;
  const url = envRequired('DATABASE_URL');
  const authToken = env('DATABASE_AUTH_TOKEN') || undefined;
  if (url.startsWith('libsql://') && !authToken) {
    throw new Error('DATABASE_AUTH_TOKEN is required for a Turso database. See .env.example.');
  }
  client = createClient({ url, authToken });
  return client;
}

export type Row = Record<string, InValue>;

export async function all<T = Row>(sql: string, args: InValue[] = []): Promise<T[]> {
  const result = await db().execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function one<T = Row>(sql: string, args: InValue[] = []): Promise<T | null> {
  const rows = await all<T>(sql, args);
  return rows[0] ?? null;
}

export async function run(sql: string, args: InValue[] = []) {
  return db().execute({ sql, args });
}

export function nowIso() {
  return new Date().toISOString();
}
