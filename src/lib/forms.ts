// Validates and stores public form submissions.
import { run, nowIso } from './db';
import { notifyOffice } from './notify';
import { site } from '../data/site';

export const FORM_TYPES = ['plan-a-visit', 'contact', 'prayer-request', 'testimony'] as const;
export type FormType = (typeof FORM_TYPES)[number];

export const FORM_LABELS: Record<FormType, string> = {
  'plan-a-visit': 'Plan a visit',
  contact: 'Contact',
  'prayer-request': 'Prayer request',
  testimony: 'Testimony',
};

interface FieldRule {
  max: number;
  required?: boolean;
  kind?: 'email' | 'phone' | 'text' | 'bool';
}

// Only these fields are stored. Anything else in the POST is ignored.
const RULES: Record<FormType, Record<string, FieldRule>> = {
  'plan-a-visit': {
    name: { max: 120, required: true },
    email: { max: 200, required: true, kind: 'email' },
    phone: { max: 40, kind: 'phone' },
    date: { max: 40 },
    service: { max: 60 },
    kids: { max: 20 },
    first_time: { max: 5, kind: 'bool' },
  },
  contact: {
    name: { max: 120, required: true },
    email: { max: 200, required: true, kind: 'email' },
    phone: { max: 40, kind: 'phone' },
    topic: { max: 60 },
    message: { max: 4000, required: true },
  },
  'prayer-request': {
    name: { max: 120 },
    email: { max: 200, kind: 'email' },
    request: { max: 4000, required: true },
    share: { max: 5, kind: 'bool' },
  },
  testimony: {
    name: { max: 120, required: true },
    email: { max: 200, required: true, kind: 'email' },
    phone: { max: 40, kind: 'phone' },
    title: { max: 200 },
    testimony: { max: 8000, required: true },
    permission: { max: 5, kind: 'bool' },
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class FormError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
  }
}

export function isFormType(value: unknown): value is FormType {
  return typeof value === 'string' && (FORM_TYPES as readonly string[]).includes(value);
}

export function validate(type: FormType, data: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [field, rule] of Object.entries(RULES[type])) {
    const raw = data.get(field);
    let value = typeof raw === 'string' ? raw.trim() : '';
    if (rule.kind === 'bool') value = raw ? 'yes' : 'no';
    if (rule.required && !value) throw new FormError('Please fill in all required fields.', field);
    if (value.length > rule.max) throw new FormError('One of the fields is too long.', field);
    if (rule.kind === 'email' && value && !EMAIL_RE.test(value)) throw new FormError('That email address does not look right.', field);
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) throw new FormError('Invalid characters.', field);
    out[field] = value;
  }
  return out;
}

// Simple per-process rate limit: 5 submissions per IP per 10 minutes.
const WINDOW_MS = 10 * 60_000;
const LIMIT = 5;
const hits = new Map<string, number[]>();

export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= LIMIT) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  return false;
}

export async function storeSubmission(type: FormType, fields: Record<string, string>, ip: string): Promise<number> {
  const created = nowIso();
  const result = await run(
    'INSERT INTO submissions (type, name, email, phone, payload, status, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [type, fields.name ?? '', fields.email ?? '', fields.phone ?? '', JSON.stringify(fields), 'new', ip, created],
  );
  const id = Number(result.lastInsertRowid);

  const lines = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n');
  void notifyOffice(
    `[${site.shortName}] New ${FORM_LABELS[type].toLowerCase()}${fields.name ? ` from ${fields.name}` : ''}`,
    `${lines}\n\nView it in the admin: ${site.url}/admin/submissions/${id}`,
  );
  return id;
}
