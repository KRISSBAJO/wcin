'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, RotateCcw, Send } from 'lucide-react';

interface SuccessContent {
  title: string;
  text: string;
  links?: { href: string; label: string }[];
}

interface Props {
  name: 'plan-a-visit' | 'contact' | 'prayer-request' | 'testimony';
  submitLabel: string;
  dark?: boolean;
  note?: string;
  success?: SuccessContent;
  children: React.ReactNode;
}

type Status = { kind: 'ok' | 'error'; text: string } | null;

/** Public form. Posts to /api/forms; works as a plain POST if JavaScript is off. Shows a thank-you panel on success. */
export default function SiteForm({ name, submitLabel, dark = false, note, success, children }: Props) {
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const required = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[required]'));
    const missing = required.find((el) => !el.value.trim());
    if (missing) {
      missing.focus();
      setStatus({ kind: 'error', text: 'Please fill in the highlighted field.' });
      return;
    }
    const email = form.querySelector<HTMLInputElement>('input[type="email"]');
    if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.focus();
      setStatus({ kind: 'error', text: 'That email address does not look right.' });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/forms', { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        if (body.field) form.querySelector<HTMLElement>(`[name="${body.field}"]`)?.focus();
        throw new Error(body.error || 'Something went wrong.');
      }
      form.reset();
      setStatus(null);
      setDone(true);
    } catch (err) {
      setStatus({ kind: 'error', text: (err as Error).message || 'Something went wrong. Please try again or email us.' });
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    const s = success ?? { title: 'Thank you', text: 'We have received your message.' };
    return (
      <div role="status" aria-live="polite" className={`flex flex-col gap-5 ${dark ? 'bg-ink p-6 text-white sm:p-10' : 'bg-paper-2 p-6 sm:p-10'}`}>
        <span className={`eyebrow flex items-center gap-2 ${dark ? 'text-gold' : ''}`}><CheckCircle2 size={18} aria-hidden="true" />Received</span>
        <h2 className="text-[44px] leading-none lg:text-[56px]">{s.title}</h2>
        <p className={`text-lg leading-[1.6] ${dark ? 'text-muted-dark' : 'text-body'}`}>{s.text}</p>
        {s.links && s.links.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {s.links.map((l, i) => (
              <Link key={l.href} href={l.href} className={`btn ${i === 0 ? 'btn-primary' : dark ? 'btn-outline-light' : 'btn-outline'}`}>{l.label}</Link>
            ))}
          </div>
        )}
        <button type="button" onClick={() => setDone(false)} className={`inline-flex items-center gap-1.5 self-start text-sm underline underline-offset-4 ${dark ? 'text-muted-dark' : 'text-muted'}`}><RotateCcw size={14} aria-hidden="true" />Send another</button>
      </div>
    );
  }

  return (
    <form
      name={name}
      method="POST"
      action="/api/forms"
      noValidate
      onSubmit={onSubmit}
      className={`flex flex-col gap-6 ${dark ? 'bg-ink p-6 text-white sm:p-10' : ''}`}
    >
      <input type="hidden" name="form" value={name} />
      <label className="sr-only-field" aria-hidden="true">
        Leave this field empty <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
      </label>
      {children}
      <button type="submit" className="btn btn-primary sm:self-start" disabled={busy}><Send size={16} aria-hidden="true" />{busy ? 'Sending…' : submitLabel}</button>
      {note && <p className={`text-[13px] leading-[1.5] ${dark ? 'text-[#9a9aa2]' : 'text-muted'}`}>{note}</p>}
      {status && (
        <p role="alert" className={`flex items-start gap-2.5 px-4 py-3.5 font-semibold ${dark ? 'bg-accent-dark text-white' : 'bg-[#fde8ea] text-accent-dark'}`}><AlertCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />{status.text}</p>
      )}
    </form>
  );
}

/** A question: big friendly label, optional hint, then the control. */
export function Field({ id, label, hint, dark, children }: { id: string; label: string; hint?: string; dark?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-2.5 ${dark ? '[&_input]:field-input-dark [&_select]:field-input-dark [&_textarea]:field-input-dark' : ''}`}>
      <label htmlFor={id} className="text-lg font-semibold leading-snug">{label}</label>
      {hint && <span className={`-mt-1 text-sm ${dark ? 'text-muted-dark' : 'text-muted'}`}>{hint}</span>}
      {children}
    </div>
  );
}

interface ChoiceOption {
  value: string;
  label: string;
  sub?: string;
}

/** A row of tappable choices backed by real radio buttons (or checkboxes with `multiple`). */
export function Choices({ name, label, hint, options, defaultValue, multiple = false, dark }: { name: string; label: string; hint?: string; options: ChoiceOption[]; defaultValue?: string; multiple?: boolean; dark?: boolean }) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="text-lg font-semibold leading-snug">{label}</legend>
      {hint && <span className={`-mt-1 text-sm ${dark ? 'text-muted-dark' : 'text-muted'}`}>{hint}</span>}
      <div className="flex flex-wrap gap-2.5">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input type={multiple ? 'checkbox' : 'radio'} name={name} value={o.value} defaultChecked={o.value === defaultValue} className="peer sr-only-field" />
            <span className={`flex min-h-12 flex-col justify-center border-2 px-4 py-2 text-left leading-tight transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-gold peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white ${dark ? 'border-[#55555c] bg-ink-2 text-white hover:border-white' : 'border-[#c4c4c9] bg-white text-ink hover:border-ink'}`}>
              <span className="font-semibold">{o.label}</span>
              {o.sub && <span className="text-xs opacity-80">{o.sub}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
