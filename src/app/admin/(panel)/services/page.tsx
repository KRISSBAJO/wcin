import { Clock } from 'lucide-react';
import { getAllServices } from '@/lib/content';
import { parseClock } from '@/lib/dates';
import { listState, sortRows, textMatch } from '@/lib/list';
import { AddLink, Empty, Flash, ListPanel, Pill, Primary, RowActions, SearchSummary, Thumb, NoThumb, td, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Service times' };
const PATH = '/admin/services';
const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Monday to Friday', 'Every day'];

export default async function ServicesAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [sp, all] = await Promise.all([searchParams, getAllServices()]);
  const state = listState(sp, 'order', 'asc', ['service', 'time', 'note', 'order', 'status']);
  const filtered = all.filter((s) => textMatch(state.q, s.day, s.label, s.note, s.time));
  const services = sortRows(filtered, (s) => ({
    service: DAY_ORDER.indexOf(s.day),
    time: parseClock(s.start_time) ?? 0,
    note: s.note,
    order: s.sort,
    status: s.active ? 0 : 1,
  })[state.sort as 'order'], state.dir);
  return (
    <>
      <PageHeader icon="services" title="Service times" description="Shown in the homepage hero cards, the footer, Plan a Visit, Events and Contact. Each day's fallback flyer lives here too.">
        <AddLink href="/admin/services/new" label="Add a service" />
      </PageHeader>
      <Flash ok={sp.ok} error={sp.error} />
      <ListPanel
        icon={Clock}
        title="All services"
        count={all.length}
        list={{ path: PATH, state }}
        searchPlaceholder="Search services"
        head={[{ label: 'Flyer', width: '72px' }, { label: 'Service', key: 'service' }, { label: 'Time', key: 'time' }, { label: 'Note', key: 'note' }, { label: 'Order', key: 'order', width: '90px' }, { label: 'Status', key: 'status', width: '110px' }, { label: 'Actions', align: 'right', srOnly: true, width: '72px' }]}
      >
        {services.length === 0 ? (
          <tr><td colSpan={7}>{state.q ? <Empty icon={Clock} title="No services match" text={`Nothing matches “${state.q}”.`} action={{ href: PATH, label: 'Show all' }} /> : <Empty icon={Clock} title="No services yet" text="Add the Sunday, mid-week and prayer services." action={{ href: '/admin/services/new', label: 'Add a service' }} />}</td></tr>
        ) : services.map((s) => (
          <tr key={s.id}>
            <td className={td}>{s.default_image ? <Thumb src={s.default_image} className="h-12 w-12" /> : <NoThumb className="h-12 w-12" />}</td>
            <td className={td}><Primary href={`/admin/services/${s.id}`} title={s.day} sub={s.label || 'Service'} /></td>
            <td className={`${td} whitespace-nowrap font-medium`}>{s.time}</td>
            <td className={`${td} max-w-[280px] truncate text-muted`}>{s.note}</td>
            <td className={`${td} tabular text-muted`}>{s.sort}</td>
            <td className={td}>{s.active ? <Pill kind="ok">live</Pill> : <Pill>hidden</Pill>}</td>
            <td className={td}><RowActions edit={`/admin/services/${s.id}`} /></td>
          </tr>
        ))}
      </ListPanel>
      <SearchSummary shown={services.length} total={all.length} path={PATH} state={state} />
    </>
  );
}
