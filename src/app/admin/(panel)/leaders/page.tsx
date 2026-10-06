import { Scissors, Users } from 'lucide-react';
import { getAllLeaders } from '@/lib/content';
import { listState, sortRows, textMatch } from '@/lib/list';
import { AddLink, Empty, Flash, ListPanel, Pill, Primary, RowActions, SearchSummary, Thumb, NoThumb, td, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Leaders' };
const PATH = '/admin/leaders';

export default async function LeadersAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [sp, all] = await Promise.all([searchParams, getAllLeaders()]);
  const cut = (l: (typeof all)[number]) => (l.cutout_url ? 0 : l.photo_url ? 1 : 2);
  const state = listState(sp, 'order', 'asc', ['leader', 'cutout', 'order', 'status']);
  const filtered = all.filter((l) => textMatch(state.q, l.name, l.role));
  const leaders = sortRows(filtered, (l) => ({ leader: l.name, cutout: cut(l), order: l.sort, status: l.active ? 0 : 1 })[state.sort as 'order'], state.dir);
  return (
    <>
      <PageHeader icon="leaders" title="Leaders" description="Shown on the About page under Leadership. Anyone with a photo can also be placed on generated flyers, even if hidden from the website.">
        <AddLink href="/admin/leaders/new" label="Add a leader" />
      </PageHeader>
      <Flash ok={sp.ok} error={sp.error} />
      <ListPanel
        icon={Users}
        title="All leaders"
        count={all.length}
        list={{ path: PATH, state }}
        searchPlaceholder="Search leaders"
        head={[{ label: 'Photo', width: '80px' }, { label: 'Leader', key: 'leader' }, { label: 'Flyer cut-out', key: 'cutout', width: '150px' }, { label: 'Order', key: 'order', width: '90px' }, { label: 'Status', key: 'status', width: '110px' }, { label: 'Actions', align: 'right', srOnly: true, width: '72px' }]}
      >
        {leaders.length === 0 ? (
          <tr><td colSpan={6}>{state.q ? <Empty icon={Users} title="No leaders match" text={`Nothing matches “${state.q}”.`} action={{ href: PATH, label: 'Show all' }} /> : <Empty icon={Users} title="No leaders yet" text="The About page shows the starter entries until you add some." action={{ href: '/admin/leaders/new', label: 'Add a leader' }} />}</td></tr>
        ) : leaders.map((l) => (
          <tr key={l.id}>
            <td className={td}>{l.photo_url ? <Thumb src={l.photo_url} className="h-16 w-14 object-top" /> : <NoThumb className="h-16 w-14" />}</td>
            <td className={`${td} max-w-[420px]`}><Primary href={`/admin/leaders/${l.id}`} title={l.name} sub={l.role} /></td>
            <td className={td}>
              {cut(l) === 0 ? (
                <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#1b5e35]"><Scissors size={14} aria-hidden="true" />Ready</span>
              ) : cut(l) === 1 ? (
                <span className="text-[13px] text-muted">Not yet</span>
              ) : (
                <span className="text-[13px] text-muted">No photo</span>
              )}
            </td>
            <td className={`${td} tabular text-muted`}>{l.sort}</td>
            <td className={td}>{l.active ? <Pill kind="ok">live</Pill> : <Pill>hidden</Pill>}</td>
            <td className={td}><RowActions edit={`/admin/leaders/${l.id}`} /></td>
          </tr>
        ))}
      </ListPanel>
      <SearchSummary shown={leaders.length} total={all.length} path={PATH} state={state} />
    </>
  );
}
