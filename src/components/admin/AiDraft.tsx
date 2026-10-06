'use client';

import { Sparkles, X } from 'lucide-react';

import { useState } from 'react';

interface Props {
  kind: 'event' | 'message';
  enabled: boolean;
  /** Map of draft keys to the ids of inputs in the form below to fill. */
  fill: Record<string, string>;
  /** Draft keys to show as read-only suggestions (with a copy button) instead of filling a field. */
  show?: Record<string, string>;
  placeholder: string;
  withUrl?: boolean;
}

/** A small box above an admin form: describe the thing, click Draft, the form fills in. */
export default function AiDraft({ kind, enabled, fill, show = {}, placeholder, withUrl = false }: Props) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [extras, setExtras] = useState<Record<string, string>>({});

  async function run() {
    setBusy(true); setError(''); setExtras({});
    try {
      const res = await fetch('/api/admin/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, text, url }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) throw new Error(body.error || 'Drafting failed.');
      const draft = body.draft as Record<string, string>;
      for (const [key, id] of Object.entries(fill)) {
        const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
        if (el && draft[key]) el.value = draft[key];
      }
      const shown: Record<string, string> = {};
      for (const [key, label] of Object.entries(show)) if (draft[key]) shown[label] = draft[key];
      setExtras(shown);
      const first = document.getElementById(Object.values(fill)[0]);
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-[#d6d6db] bg-[#fafafb] p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-ink text-gold">
          <Sparkles size={14} className="text-gold" aria-hidden="true" />
        </span>
        <span className="text-sm font-bold">Draft with AI</span>
        {!enabled && <span className="text-xs text-muted">Add ANTHROPIC_API_KEY or OPENAI_API_KEY to turn this on.</span>}
      </div>
      {withUrl && (
        <input value={url} onChange={(e) => setUrl(e.target.value)} disabled={!enabled} placeholder="YouTube link (optional)" className="w-full rounded-lg border border-[#d6d6db] bg-white px-3.5 py-2.5 text-[15px] disabled:bg-paper-2" />
      )}
      <textarea value={text} onChange={(e) => setText(e.target.value)} disabled={!enabled} placeholder={placeholder} rows={3} className="w-full resize-y rounded-lg border border-[#d6d6db] bg-white px-3.5 py-2.5 text-[15px] disabled:bg-paper-2" />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={run} disabled={!enabled || busy || (!text.trim() && !url.trim())} className="inline-flex min-h-10 items-center rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? 'Drafting…' : 'Draft and fill the form'}
        </button>
        <span className="text-xs text-muted">You can edit everything before saving.</span>
      </div>
      {error && <p className="text-sm font-semibold text-accent-dark">{error}</p>}
      {Object.entries(extras).map(([label, value]) => (
        <div key={label} className="flex flex-col gap-1 rounded-lg bg-white p-3 ring-1 ring-line">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{label}</span>
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm">{value}</span>
            <button type="button" onClick={() => navigator.clipboard?.writeText(value)} className="shrink-0 text-xs font-semibold text-accent">Copy</button>
          </div>
        </div>
      ))}
    </div>
  );
}
