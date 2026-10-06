import Link from 'next/link';
import { Archive, Inbox, Layers, LayoutList, type LucideIcon } from 'lucide-react';
import { all } from '@/lib/db';
import { FORM_LABELS, FORM_TYPES, isFormType } from '@/lib/forms';
import { stamp } from '@/lib/dates';
import { listState } from '@/lib/list';
import { Empty, Flash, ListPanel, PageHeader, Pill, Primary, SearchSummary, formIcons, td } from '@/components/admin/ui';

export const metadata = { title: 'Inbox' };
const PATH = '/admin/inbox';

interface Row { id: number; type: string; name: string; email: string; phone: string; payload: string; status: string; created_at: string }

function preview(r: Row) {
  try {
    const p = JSON.parse(r.payload) as Record<string, string>;
    const text = p.message || p.request || p.testimony || [p.date, p.service, p.kids && `${p.kids} kids`].filter(Boolean).join(' · ') || '';
    return text.length > 90 ? text.slice(0, 90) + '…' : text;
  } catch { return ''; }
}

const ORDER: Record<string, string> = { when: 'created_at', form: 'type', from: 'lower(name)', status: "CASE status WHEN 'new' THEN 0 WHEN 'read' THEN 1 ELSE 2 END" };

export default async function InboxPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const typeFilter = sp.type ?? '';
  const statusFilter = sp.status ?? 'open';
  const state = listState(sp, 'when', 'desc', Object.keys(ORDER));
  const extra = { type: typeFilter, status: statusFilter };

  // Filters (form type, open/archived) apply to both queries; the search text only narrows the rows shown.
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (isFormType(typeFilter)) { where.push('type = ?'); args.push(typeFilter); }
  if (statusFilter === 'open') where.push("status IN ('new','read')");
  else if (statusFilter === 'archived') where.push("status = 'archived'");
  const baseWhere = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const searchWhere = state.q ? `${baseWhere ? baseWhere + ' AND' : 'WHERE'} (name LIKE ? OR email LIKE ? OR phone LIKE ? OR payload LIKE ?)` : baseWhere;
  const like = `%${state.q.replace(/[%_]/g, '')}%`;
  const searchArgs = state.q ? [...args, like, like, like, like] : args;
  const [rows, totalRow] = await Promise.all([
    all<Row>(`SELECT id, type, name, email, phone, payload, status, created_at FROM submissions ${searchWhere} ORDER BY ${ORDER[state.sort]} ${state.dir === 'asc' ? 'ASC' : 'DESC'}, id DESC LIMIT 200`, searchArgs),
    all<{ n: number }>(`SELECT COUNT(*) AS n FROM submissions ${baseWhere}`, args),
  ]);
  const total = Number(totalRow[0]?.n ?? rows.length);

  const link = (patch: Record<string, string>) => {
    const q = new URLSearchParams({ type: typeFilter, status: statusFilter, q: state.q, sort: state.sort, dir: state.dir, ...patch });
    for (const [k, v] of [...q]) if (!v) q.delete(k);
    return `${PATH}?${q}`;
  };
  const chip = (href: string, on: boolean, label: string, Icon?: LucideIcon) => (
    <Link key={href + label} href={href} aria-current={on ? 'true' : undefined} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium no-underline ring-1 ${on ? 'bg-ink text-white ring-ink' : 'bg-white text-ink ring-line hover:ring-ink/40'}`}>{Icon && <Icon size={14} className={on ? 'text-gold' : 'text-muted'} aria-hidden="true" />}{label}</Link>
  );
  return (
    <>
      <PageHeader icon="inbox" title="Inbox" description="Everything sent through the website's forms. Opening a submission marks it as read." />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="flex flex-wrap items-center gap-2">
        {chip(link({ type: '' }), !typeFilter, 'All forms', LayoutList)}
        {FORM_TYPES.map((t) => chip(link({ type: t }), typeFilter === t, FORM_LABELS[t], formIcons[t]))}
        <span className="flex-1" />
        {chip(link({ status: 'open' }), statusFilter === 'open', 'Open', Inbox)}
        {chip(link({ status: 'archived' }), statusFilter === 'archived', 'Archived', Archive)}
        {chip(link({ status: 'all' }), statusFilter === 'all', 'All', Layers)}
      </div>
      <ListPanel
        icon={Inbox}
        title={statusFilter === 'archived' ? 'Archived' : statusFilter === 'all' ? 'All submissions' : 'Open submissions'}
        count={total}
        list={{ path: PATH, state, extra }}
        searchPlaceholder="Search name, email or text"
        head={[{ label: 'When', key: 'when', width: '190px' }, { label: 'Form', key: 'form', width: '170px' }, { label: 'From', key: 'from' }, { label: 'Preview' }, { label: 'Status', key: 'status', width: '110px' }]}
      >
        {rows.length === 0 ? (
          <tr><td colSpan={5}>{state.q ? <Empty title="Nothing matches" text={`No submissions match “${state.q}”.`} action={{ href: link({ q: '' }), label: 'Show all' }} /> : <Empty title="Nothing here yet" text="Submissions from the website's forms will show up in this inbox." />}</td></tr>
        ) : rows.map((r) => {
          const I = formIcons[r.type];
          const isNew = r.status === 'new';
          return (
            <tr key={r.id} className={isNew ? 'bg-[#fffafa]' : ''}>
              <td className={`${td} whitespace-nowrap ${isNew ? 'font-semibold' : ''}`}><Link className="text-ink no-underline hover:text-accent" href={`/admin/submissions/${r.id}`}>{stamp(r.created_at)}</Link></td>
              <td className={td}><span className={`inline-flex items-center gap-2 whitespace-nowrap ${isNew ? 'font-semibold' : ''}`}>{I && <I size={16} className="text-muted" aria-hidden="true" />}{FORM_LABELS[r.type as keyof typeof FORM_LABELS] ?? r.type}</span></td>
              <td className={`${td} max-w-[260px]`}><Primary href={`/admin/submissions/${r.id}`} title={r.name || 'Anonymous'} sub={r.email || r.phone || undefined} /></td>
              <td className={`${td} text-body`}><Link className="block w-[240px] truncate text-body no-underline hover:text-accent sm:w-[340px]" href={`/admin/submissions/${r.id}`} title={preview(r)}>{preview(r) || 'Open'}</Link></td>
              <td className={td}><Pill kind={isNew ? 'new' : r.status === 'read' ? 'ok' : 'muted'}>{r.status}</Pill></td>
            </tr>
          );
        })}
      </ListPanel>
      <SearchSummary shown={rows.length} total={total} path={PATH} state={state} extra={extra} />
    </>
  );
}
