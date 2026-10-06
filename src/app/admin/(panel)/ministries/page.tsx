import { Sparkles } from 'lucide-react';
import { getAllMinistries } from '@/lib/content';
import { listState, sortRows, textMatch } from '@/lib/list';
import { AddLink, Empty, Flash, ListPanel, Pill, Primary, RowActions, SearchSummary, Thumb, NoThumb, td, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Ministries' };
const PATH = '/admin/ministries';

export default async function MinistriesAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [sp, all] = await Promise.all([searchParams, getAllMinistries()]);
  const state = listState(sp, 'order', 'asc', ['ministry', 'tag', 'order', 'status']);
  const filtered = all.filter((m) => textMatch(state.q, m.title, m.tag, m.summary));
  const ministries = sortRows(filtered, (m) => ({ ministry: m.title, tag: m.tag, order: m.sort, status: m.active ? 0 : 1 })[state.sort as 'order'], state.dir);
  return (
    <>
      <PageHeader icon="ministries" title="Ministries" description="Shown as cards on the homepage and in full on the Ministries page. Photos look best landscape, 1200 × 900 pixels or larger.">
        <AddLink href="/admin/ministries/new" label="Add a ministry" />
      </PageHeader>
      <Flash ok={sp.ok} error={sp.error} />
      <ListPanel
        icon={Sparkles}
        title="All ministries"
        count={all.length}
        list={{ path: PATH, state }}
        searchPlaceholder="Search ministries"
        head={[{ label: 'Photo', width: '88px' }, { label: 'Ministry', key: 'ministry' }, { label: 'Tag', key: 'tag', width: '140px' }, { label: 'Order', key: 'order', width: '90px' }, { label: 'Status', key: 'status', width: '110px' }, { label: 'Actions', align: 'right', srOnly: true, width: '72px' }]}
      >
        {ministries.length === 0 ? (
          <tr><td colSpan={6}>{state.q ? <Empty icon={Sparkles} title="No ministries match" text={`Nothing matches “${state.q}”.`} action={{ href: PATH, label: 'Show all' }} /> : <Empty icon={Sparkles} title="No ministries yet" text="The site shows the starter list until you add some." action={{ href: '/admin/ministries/new', label: 'Add a ministry' }} />}</td></tr>
        ) : ministries.map((m) => (
          <tr key={m.id}>
            <td className={td}>{m.photo_url ? <Thumb src={m.photo_url} className="h-12 w-16" /> : <NoThumb className="h-12 w-16" />}</td>
            <td className={`${td} max-w-[480px]`}><Primary href={`/admin/ministries/${m.id}`} title={m.title} sub={m.summary} /></td>
            <td className={td}>{m.tag && <Pill>{m.tag}</Pill>}</td>
            <td className={`${td} tabular text-muted`}>{m.sort}</td>
            <td className={td}>{m.active ? <Pill kind="ok">live</Pill> : <Pill>hidden</Pill>}</td>
            <td className={td}><RowActions edit={`/admin/ministries/${m.id}`} /></td>
          </tr>
        ))}
      </ListPanel>
      <SearchSummary shown={ministries.length} total={all.length} path={PATH} state={state} />
    </>
  );
}
