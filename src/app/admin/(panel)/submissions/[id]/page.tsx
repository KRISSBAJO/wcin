import { redirect } from 'next/navigation';
import { Archive, CircleDot, FileText, Inbox, MailOpen, Reply, Trash2 } from 'lucide-react';
import { one, run } from '@/lib/db';
import { FORM_LABELS } from '@/lib/forms';
import { stamp } from '@/lib/dates';
import { idParam } from '@/lib/admin';
import { deleteSubmission, setSubmissionStatus } from '../../../actions';
import { Back, Panel, Pill, btnDanger, btnOutline, btnPrimary, PageHeader } from '@/components/admin/ui';

interface Row { id: number; type: string; name: string; email: string; phone: string; payload: string; status: string; ip: string; created_at: string }

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = idParam((await params).id);
  if (!id) redirect('/admin/inbox');
  const row = await one<Row>('SELECT * FROM submissions WHERE id = ?', [id]);
  if (!row) redirect('/admin/inbox');
  if (row.status === 'new') {
    await run("UPDATE submissions SET status = 'read' WHERE id = ?", [id]);
    row.status = 'read';
  }
  let fields: Record<string, string> = {};
  try { fields = JSON.parse(row.payload); } catch {}
  const label = FORM_LABELS[row.type as keyof typeof FORM_LABELS] ?? row.type;
  const pretty = (k: string) => k.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  const mark = (status: 'new' | 'read' | 'archived') => setSubmissionStatus.bind(null, id, status);
  return (
    <>
      <PageHeader icon="inbox" title={`${label} · ${row.name || 'Anonymous'}`} />
      <Back href="/admin/inbox" label="Back to inbox" />
      <Panel icon={FileText} title="Submission">
        <div className="flex flex-wrap items-center gap-3">
          <Pill kind={row.status === 'read' ? 'ok' : 'muted'}>{row.status}</Pill>
          <span className="text-muted">Received {stamp(row.created_at)}</span>
        </div>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-[160px_minmax(0,1fr)]">
          {Object.entries(fields).map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-bold text-muted">{pretty(k)}</dt>
              <dd className="m-0 whitespace-pre-wrap break-words">
                {k === 'email' && v ? <a href={`mailto:${v}`}>{v}</a> : k === 'phone' && v ? <a href={`tel:${v}`}>{v}</a> : v || '—'}
              </dd>
            </div>
          ))}
        </dl>
        {row.email && (
          <p><a className={btnPrimary} href={`mailto:${row.email}?subject=${encodeURIComponent(`Re: your ${label.toLowerCase()} — Winners Chapel Nashville`)}`}><Reply size={16} aria-hidden="true" />Reply by email</a></p>
        )}
      </Panel>
      <Panel icon={CircleDot} title="Status">
        <div className="flex flex-wrap items-center gap-3">
          {row.status !== 'archived' && <form action={mark('archived')}><button className={btnOutline}><Archive size={16} aria-hidden="true" />Archive</button></form>}
          {row.status === 'archived' && <form action={mark('read')}><button className={btnOutline}><Inbox size={16} aria-hidden="true" />Move back to inbox</button></form>}
          <form action={mark('new')}><button className={btnOutline}><MailOpen size={16} aria-hidden="true" />Mark as unread</button></form>
          <form action={deleteSubmission.bind(null, id)}><button className={btnDanger}><Trash2 size={16} aria-hidden="true" />Delete</button></form>
        </div>
      </Panel>
    </>
  );
}
