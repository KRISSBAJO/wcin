import { Calendar } from 'lucide-react';
import { getAllEvents } from '@/lib/content';
import { longDate, todayCentral } from '@/lib/dates';
import { listState, sortRows, textMatch } from '@/lib/list';
import { AddLink, Empty, Flash, ListPanel, Pill, Primary, RowActions, SearchSummary, td, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Events' };
const PATH = '/admin/events';

export default async function EventsAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [sp, all] = await Promise.all([searchParams, getAllEvents()]);
  const today = todayCentral();
  const rank = (e: (typeof all)[number]) => (!e.published ? 2 : (e.ends_on ?? e.starts_on) < today ? 1 : 0);
  const upcoming = all.filter((e) => rank(e) === 0).length;
  const state = listState(sp, 'date', 'asc', ['date', 'event', 'status']);
  const filtered = all.filter((e) => textMatch(state.q, e.title, e.detail, e.starts_on));
  const events = sortRows(filtered, (e) => ({ date: e.starts_on, event: e.title, status: rank(e) })[state.sort as 'date'], state.dir);
  return (
    <>
      <PageHeader icon="events" title="Events" description="Special services, classes and gatherings. Published upcoming events show on the homepage and the Events page.">
        <AddLink href="/admin/events/new" label="Add an event" />
      </PageHeader>
      <Flash ok={sp.ok} error={sp.error} />
      <ListPanel
        icon={Calendar}
        title="All events"
        count={all.length}
        description={`${upcoming} upcoming on the website.`}
        list={{ path: PATH, state }}
        searchPlaceholder="Search events"
        head={[{ label: 'Date', key: 'date', width: '200px' }, { label: 'Event', key: 'event' }, { label: 'Status', key: 'status', width: '130px' }, { label: 'Actions', align: 'right', srOnly: true, width: '72px' }]}
      >
        {events.length === 0 ? (
          <tr><td colSpan={4}>{state.q ? <Empty icon={Calendar} title="No events match" text={`Nothing matches “${state.q}”.`} action={{ href: PATH, label: 'Show all' }} /> : <Empty icon={Calendar} title="No events yet" text="Special services, classes and gatherings you add show on the homepage and the Events page." action={{ href: '/admin/events/new', label: 'Add an event' }} />}</td></tr>
        ) : events.map((e) => (
          <tr key={e.id}>
            <td className={`${td} whitespace-nowrap`}>
              <span className="font-medium">{longDate(e.starts_on)}</span>
              {e.ends_on && e.ends_on !== e.starts_on && <span className="block text-[12.5px] text-muted">to {longDate(e.ends_on)}</span>}
            </td>
            <td className={`${td} max-w-[520px]`}><Primary href={`/admin/events/${e.id}`} title={e.title} sub={e.detail} /></td>
            <td className={td}>{rank(e) === 2 ? <Pill>hidden</Pill> : rank(e) === 1 ? <Pill>past</Pill> : <Pill kind="ok">upcoming</Pill>}</td>
            <td className={td}><RowActions edit={`/admin/events/${e.id}`} /></td>
          </tr>
        ))}
      </ListPanel>
      <SearchSummary shown={events.length} total={all.length} path={PATH} state={state} />
    </>
  );
}
