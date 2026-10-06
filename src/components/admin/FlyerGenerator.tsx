'use client';

import { CalendarDays, CheckCircle2, Download, Loader2, Sparkles, X } from 'lucide-react';

import { useEffect, useRef, useState } from 'react';
import { downloadHref } from '@/lib/media';

interface Props {
  enabled: boolean;
  /** ids of the service and date controls in the surrounding form */
  serviceId: string;
  dateId: string;
  /** ids of the hidden inputs that carry the generated image into the form */
  keyId: string;
  urlId: string;
  /** id of the file input, so it can be relaxed once a generated image is attached */
  fileId: string;
  /** active leaders; `cutout` and `photo` say which images they have */
  leaders?: { id: number; name: string; role: string; cutout: boolean; photo: boolean }[];
  /** service days to choose from, same list as the form's select */
  days?: { value: string; label: string }[];
  /** earliest allowed date (today, Central time) */
  minDate?: string;
  /** id of the form's optional last-day input, for multi-day programmes */
  endId?: string;
  /** a generated image already attached (restored after a validation error) */
  initial?: { key: string; url: string };
}

/**
 * "Generate with AI" button for the flyer form. Opens a dialog, generates a flyer with the
 * service date and times already on it, and attaches the result to the form on "Use this flyer".
 */
export default function FlyerGenerator({ enabled, serviceId, dateId, keyId, urlId, fileId, leaders = [], days = [], minDate, endId, initial }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState('');
  const [scene, setScene] = useState('');
  const [eyebrow, setEyebrow] = useState('');
  const [leaderId, setLeaderId] = useState('');
  const [leaderMode, setLeaderMode] = useState<'cutout' | 'paint'>('cutout');
  const [day, setDay] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const chosen = leaders.find((l) => String(l.id) === leaderId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ url: string; key: string } | null>(null);
  const [attached, setAttached] = useState<string | null>(initial?.url ?? null);
  const [elapsed, setElapsed] = useState(0);

  // After a failed save the page comes back with the generated image in the query string: re-attach it.
  useEffect(() => {
    if (!initial) return;
    const file = document.getElementById(fileId) as HTMLInputElement | null;
    if (file) file.required = false;
    setPreview(initial);
  }, [initial, fileId]);

  // Progress while generating: a ticking clock, a bar that eases towards the end, and a stage line.
  useEffect(() => {
    if (!busy) { setElapsed(0); return; }
    const started = Date.now();
    const t = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 500);
    return () => clearInterval(t);
  }, [busy]);
  const expected = leaderId ? 60 : 35;
  const progress = Math.min(96, Math.round(100 * (1 - Math.exp(-elapsed / (expected / 2.5)))));
  const stage =
    elapsed < 3 ? 'Sending your description to the artist…' :
    elapsed < expected * 0.7 ? (leaderId && leaderMode === 'paint' ? 'Painting the scene with the leader in it…' : 'Painting the background…') :
    elapsed < expected ? 'Adding the title, date and times in the church fonts…' :
    'Nearly there, finishing up…';

  const val = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value ?? '';
  const setVal = (id: string, v: string) => { const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null; if (el) el.value = v; };

  /** Opens the dialog with the service and date copied in from the form, so they are chosen once. */
  function open() {
    setDay(val(serviceId) || days[0]?.value || '');
    setDate(val(dateId));
    setEndDate(endId ? val(endId) : '');
    setError('');
    dialog.current?.showModal();
  }
  const pickDay = (v: string) => { setDay(v); setVal(serviceId, v); };
  const pickDate = (v: string) => { setDate(v); setVal(dateId, v); };
  const pickEnd = (v: string) => { setEndDate(v); if (endId) setVal(endId, v); };

  async function generate() {
    if (!day || !date) { setError('Choose the service and its date, so the flyer shows the right time.'); return; }
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/admin/ai/flyer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, scene, eyebrow, service_day: day, service_date: date, end_date: endDate || undefined, leader_id: leaderId || undefined, leader_mode: leaderMode }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) throw new Error(body.error || 'Generation failed.');
      setPreview({ url: body.url, key: body.key });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function useFlyer() {
    if (!preview) return;
    (document.getElementById(keyId) as HTMLInputElement).value = preview.key;
    (document.getElementById(urlId) as HTMLInputElement).value = preview.url;
    const file = document.getElementById(fileId) as HTMLInputElement | null;
    if (file) { file.value = ''; file.required = false; }
    const caption = document.getElementById('headline') as HTMLInputElement | null;
    if (caption && !caption.value && title) caption.value = title;
    setAttached(preview.url);
    dialog.current?.close();
  }

  function clearAttached() {
    (document.getElementById(keyId) as HTMLInputElement).value = '';
    (document.getElementById(urlId) as HTMLInputElement).value = '';
    const file = document.getElementById(fileId) as HTMLInputElement | null;
    if (file) file.required = true;
    setAttached(null);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={!enabled} onClick={open} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-50">
          <Sparkles size={14} className="text-gold" aria-hidden="true" />
          Generate with AI
        </button>
        <span className="text-xs text-muted">{enabled ? 'No image to upload? Describe one and the app makes it, with the date and times already on it.' : 'Add OPENAI_API_KEY to turn this on.'}</span>
      </div>
      {attached && (
        <div className="flex items-center gap-4 rounded-lg bg-[#eef9f1] p-3 ring-1 ring-[#bfe3c8]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={attached} alt="" className="h-20 w-20 rounded-md object-cover ring-1 ring-line" />
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-[#1e5631]">Generated flyer attached</span>
            <span className="text-muted">Fill in the rest and click Upload and add.</span>
            <button type="button" onClick={clearAttached} className="self-start text-xs font-semibold text-accent-dark">Remove</button>
          </div>
        </div>
      )}

      <dialog ref={dialog} className="m-auto w-[min(92vw,720px)] rounded-2xl p-0 shadow-2xl backdrop:bg-ink/60">
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-sans text-lg font-bold">Generate a flyer</h2>
              <p className="text-sm text-muted">Pick the service and date, describe the picture, and the app adds the words, date and times in the church fonts.</p>
            </div>
            <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="rounded-lg p-1.5 text-muted hover:bg-paper-2">
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_280px]">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 rounded-lg bg-paper-2 p-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold"><span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-accent" aria-hidden="true" />Service</span>
                  <select value={day} onChange={(e) => pickDay(e.target.value)} className="rounded-lg border border-[#d6d6db] bg-white px-3 py-2 text-[14px] font-normal">
                    {days.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">{endDate ? 'First day' : 'Date of that service'}
                  <input type="date" value={date} min={minDate} onChange={(e) => pickDate(e.target.value)} className="rounded-lg border border-[#d6d6db] bg-white px-3 py-2 text-[14px] font-normal" />
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold sm:col-span-2"><span>Last day of the programme <span className="font-normal text-muted">(only if it runs several days, e.g. Wednesday to Friday; the flyer then shows a date range)</span></span>
                  <input type="date" value={endDate} min={date || minDate} onChange={(e) => pickEnd(e.target.value)} className="rounded-lg border border-[#d6d6db] bg-white px-3 py-2 text-[14px] font-normal sm:w-1/2" />
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Flyer title
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="Showers of Blessings" className="rounded-lg border border-[#d6d6db] px-3.5 py-2.5 text-[15px] font-normal" />
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold">The picture
                <textarea value={scene} onChange={(e) => setScene(e.target.value)} maxLength={300} rows={3} placeholder="gentle rain falling through golden sunlight over green hills" className="resize-y rounded-lg border border-[#d6d6db] px-3.5 py-2.5 text-[15px] font-normal" />
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Small line above the title (optional)
                <input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} maxLength={40} placeholder={endDate ? 'Join us this week for' : 'Join us this Sunday for'} className="rounded-lg border border-[#d6d6db] px-3.5 py-2.5 text-[15px] font-normal" />
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Include a leader (optional)
                <select value={leaderId} onChange={(e) => { setLeaderId(e.target.value); const l = leaders.find((x) => String(x.id) === e.target.value); if (l && !l.cutout && l.photo) setLeaderMode('paint'); }} className="rounded-lg border border-[#d6d6db] bg-white px-3.5 py-2.5 text-[15px] font-normal">
                  <option value="">No one, just the artwork</option>
                  {leaders.filter((l) => l.cutout || l.photo).map((l) => <option key={l.id} value={l.id}>{l.name}{l.role ? ` · ${l.role}` : ''}</option>)}
                </select>
                {!leaders.some((l) => l.cutout || l.photo) && <span className="text-xs font-normal text-muted">No pictures yet. <a href="/admin/leaders" className="font-semibold text-ink underline underline-offset-2">Add a photo or cut-out under Leaders</a>, then they appear here. A leader can be hidden from the About page and still be used on flyers.</span>}
              </label>
              {chosen && (
                <fieldset className="flex flex-col gap-2 rounded-lg bg-paper-2 p-3 text-sm">
                  <label className={`flex items-start gap-2 ${chosen.cutout ? '' : 'opacity-50'}`}>
                    <input type="radio" name="leader_mode" checked={leaderMode === 'cutout'} disabled={!chosen.cutout} onChange={() => setLeaderMode('cutout')} className="mt-1 accent-accent" />
                    <span><span className="font-semibold">Place their cut-out photo as-is.</span> <span className="text-muted">Exact likeness. {chosen.cutout ? '' : 'Needs a flyer cut-out under Leaders.'}</span></span>
                  </label>
                  <label className={`flex items-start gap-2 ${chosen.photo || chosen.cutout ? '' : 'opacity-50'}`}>
                    <input type="radio" name="leader_mode" checked={leaderMode === 'paint'} disabled={!(chosen.photo || chosen.cutout)} onChange={() => setLeaderMode('paint')} className="mt-1 accent-accent" />
                    <span><span className="font-semibold">Let the AI paint them in from their photo.</span> <span className="text-muted">Blends into the scene; likeness is usually close but check it before using.</span></span>
                  </label>
                </fieldset>
              )}
              {error && <p className="text-sm font-semibold text-accent-dark">{error}</p>}
            </div>
            <div className="flex flex-col gap-3 self-start">
              <div className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-paper-2 ring-1 ring-line ${busy ? 'animate-pulse' : ''}`} aria-busy={busy}>
                {preview && !busy ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.url} alt="Generated flyer preview" className="h-full w-full object-contain" />
                ) : busy ? (
                  <span className="flex flex-col items-center gap-3 px-6 text-center text-xs uppercase tracking-[0.1em] text-muted">
                    <Loader2 size={32} className="animate-spin text-accent" aria-hidden="true" />
                    Generating
                  </span>
                ) : (
                  <span className="px-6 text-center text-xs uppercase tracking-[0.1em] text-muted">Preview appears here</span>
                )}
              </div>
              {busy && (
                <div role="status" aria-live="polite" className="flex flex-col gap-2 rounded-xl bg-ink p-4 text-white">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin text-gold" aria-hidden="true" />Generating your flyer</span>
                    <span className="tabular-nums text-[#c9c9cf]">{elapsed}s</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-[#c9c9cf]">{stage}</p>
                  <p className="text-[11px] text-[#8a8a92]">Usually about {expected} seconds. Please keep this window open.</p>
                </div>
              )}
              {preview && !busy && (
                <div className="flex flex-col gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-[#1e5631]"><CheckCircle2 size={16} aria-hidden="true" />Ready. Use it, or change the words and try another.</p>
                  <a href={downloadHref(preview.url, title || 'flyer')} download className="inline-flex min-h-9 items-center gap-2 self-start rounded-lg border border-[#d6d6db] px-3 text-sm font-semibold text-ink no-underline hover:border-ink"><Download size={15} aria-hidden="true" />Download image</a>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">
            <button type="button" onClick={() => dialog.current?.close()} className="inline-flex min-h-10 items-center rounded-lg border border-[#d6d6db] px-4 text-sm font-semibold">Cancel</button>
            <button type="button" onClick={generate} disabled={busy || !title.trim() || !day || !date} className="inline-flex min-h-10 items-center rounded-lg border border-ink px-4 text-sm font-semibold disabled:opacity-50">
              {busy ? 'Generating…' : preview ? 'Try another' : 'Generate'}
            </button>
            <button type="button" onClick={useFlyer} disabled={!preview || busy} className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50">Use this flyer</button>
          </div>
        </div>
      </dialog>
    </>
  );
}
