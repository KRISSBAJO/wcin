import Link from 'next/link';
import { CalendarClock, Download, ImageOff, Images } from 'lucide-react';
import { getAllSlides, getServices, groupByDay } from '@/lib/content';
import { longDate, stamp } from '@/lib/dates';
import { downloadHref } from '@/lib/media';
import { listState, sortRows, textMatch } from '@/lib/list';
import { AddLink, Empty, Flash, IconLink, ListPanel, Panel, Pill, Primary, RowActions, SearchSummary, Thumb, td, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Hero flyers' };
const PATH = '/admin/hero';

export default async function HeroAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [sp, all, services] = await Promise.all([searchParams, getAllSlides(), getServices(true)]);
  const groups = groupByDay(services);
  const now = new Date().toISOString();
  const rank = (s: (typeof all)[number]) => (!s.active ? 2 : s.expires_at && s.expires_at <= now ? 1 : 0);
  const status = (s: (typeof all)[number]) => {
    const r = rank(s);
    return r === 2 ? <Pill>hidden</Pill> : r === 1 ? <Pill>expired</Pill> : <Pill kind="ok">live</Pill>;
  };
  const live = all.filter((s) => rank(s) === 0).length;
  const state = listState(sp, 'date', 'desc', ['caption', 'date', 'until', 'status']);
  const filtered = all.filter((s) => textMatch(state.q, s.headline, s.service_day, s.service_date, s.end_date));
  const slides = sortRows(filtered, (s) => ({ caption: s.headline, date: s.service_date, until: s.expires_at, status: rank(s) })[state.sort as 'date'], state.dir);
  return (
    <>
      <PageHeader icon="hero" title="Hero flyers" description="The homepage shows one panel per service day. A special flyer takes over that day's panel from the moment it is added until 12 hours after the service, then the fallback flyer returns on its own.">
        <AddLink href="/admin/hero/new" label="Add a special flyer" />
      </PageHeader>
      <Flash ok={sp.ok} error={sp.error} />

      <ListPanel
        icon={CalendarClock}
        title="Special flyers"
        count={all.length}
        description={live ? `${live} live right now.` : 'None live right now; the fallback flyers are showing.'}
        list={{ path: PATH, state }}
        searchPlaceholder="Search flyers"
        head={[{ label: 'Flyer', width: '88px' }, { label: 'Caption', key: 'caption' }, { label: 'Service date', key: 'date' }, { label: 'Shows until', key: 'until' }, { label: 'Status', key: 'status', width: '110px' }, { label: 'Actions', align: 'right', srOnly: true, width: '110px' }]}
      >
        {slides.length === 0 ? (
          <tr><td colSpan={6}>{state.q ? <Empty icon={ImageOff} title="No flyers match" text={`Nothing matches “${state.q}”.`} action={{ href: PATH, label: 'Show all' }} /> : <Empty icon={ImageOff} title="No special flyers yet" text="Upload one, or generate it with AI. The fallback flyers keep showing until then." action={{ href: '/admin/hero/new', label: 'Add a special flyer' }} />}</td></tr>
        ) : slides.map((s) => (
          <tr key={s.id}>
            <td className={td}><Link href={`/admin/hero/${s.id}`}><Thumb src={s.image_url} className="h-16 w-16" /></Link></td>
            <td className={`${td} max-w-[360px]`}><Primary href={`/admin/hero/${s.id}`} title={s.headline || '(no caption)'} sub={`Replaces ${s.service_day || '—'}`} /></td>
            <td className={`${td} whitespace-nowrap`}>{s.service_date ? longDate(s.service_date) : '—'}{s.end_date && s.end_date > s.service_date ? <span className="block text-[12.5px] text-muted">to {longDate(s.end_date)}</span> : null}</td>
            <td className={`${td} whitespace-nowrap text-muted`}>{s.expires_at ? stamp(s.expires_at) : '—'}</td>
            <td className={td}>{status(s)}</td>
            <td className={td}>
              <RowActions edit={`/admin/hero/${s.id}`}>
                <IconLink href={downloadHref(s.image_url, s.headline || `${s.service_day} flyer`)} label="Download image" icon={Download} download />
              </RowActions>
            </td>
          </tr>
        ))}
      </ListPanel>
      <SearchSummary shown={slides.length} total={all.length} path={PATH} state={state} />

      <Panel icon={Images} title="Fallback flyers" description="Shown when no special flyer is live. Change them under Services.">
        <div className="flex flex-wrap gap-5">
          {groups.map((g) => (
            <Link key={g.day} href="/admin/services" className="flex flex-col gap-2 text-[13px] no-underline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {g.image ? <img src={g.image} alt="" className="h-28 w-28 rounded-xl bg-paper-2 object-cover ring-1 ring-black/5" /> : <div className="placeholder-box h-28 w-28 rounded-xl text-[10px]">none</div>}
              <span className="font-medium text-ink">{g.day}</span>
            </Link>
          ))}
        </div>
      </Panel>
    </>
  );
}
