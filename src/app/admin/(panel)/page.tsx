import Link from 'next/link';
import { all, one } from '@/lib/db';
import { getHeroPanels, getLiveSlides, getServices, getSettings, groupByDay } from '@/lib/content';
import { FORM_LABELS } from '@/lib/forms';
import { centralToIso, longDate, monthDay, parseClock, todayCentral, upcomingDates } from '@/lib/dates';
import { notifyConfigured } from '@/lib/notify';
import { openaiConfigured } from '@/lib/openai';
import { textProvider } from '@/lib/llm';
import { Empty, Flash, formIcons } from '@/components/admin/ui';
import { currentUser } from '@/lib/auth';
import {
  ArrowRight, Calendar, CalendarPlus, Check, Clock, ExternalLink, Image as ImageIcon, ImagePlus, Inbox as InboxIcon, ListPlus, Images, Sparkles, Mail, Clapperboard, UserRound,
  type LucideIcon,
} from 'lucide-react';

export const metadata = { title: 'Dashboard' };

interface Sub { id: number; type: string; name: string; email: string; status: string; created_at: string }
interface Ev { id: number; title: string; detail: string; starts_on: string; ends_on: string | null }

async function count(sql: string, args: (string | number)[] = []) {
  try { return Number((await one<{ n: number }>(sql, args))?.n ?? 0); } catch { return 0; }
}

/** "3 min ago", "2 h ago", "yesterday", or the date. */
function ago(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  const min = Math.round(ms / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d} days ago`;
  return longDate(iso.slice(0, 10)).replace(/, \d{4}$/, '');
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

const DAY_INDEX: Record<string, number[]> = {
  Sunday: [0], Monday: [1], Tuesday: [2], Wednesday: [3], Thursday: [4], Friday: [5], Saturday: [6],
  'Monday to Friday': [1, 2, 3, 4, 5], 'Every day': [0, 1, 2, 3, 4, 5, 6],
};

function greeting(): string {
  const h = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', hour12: false }).format(new Date()));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [sp, me] = await Promise.all([searchParams, currentUser()]);
  const today = todayCentral();
  const [newSubs, openSubs, upcomingEvents, recent, nextEvents, services, slides, panels, settings, ministriesWithPhoto, ministriesTotal, pastor] = await Promise.all([
    count("SELECT COUNT(*) AS n FROM submissions WHERE status = 'new'"),
    count("SELECT COUNT(*) AS n FROM submissions WHERE status IN ('new','read')"),
    count('SELECT COUNT(*) AS n FROM events WHERE published = 1 AND COALESCE(ends_on, starts_on) >= ?', [today]),
    all<Sub>('SELECT id, type, name, email, status, created_at FROM submissions ORDER BY created_at DESC LIMIT 6').catch(() => [] as Sub[]),
    all<Ev>('SELECT id, title, detail, starts_on, ends_on FROM events WHERE published = 1 AND COALESCE(ends_on, starts_on) >= ? ORDER BY starts_on ASC LIMIT 4', [today]).catch(() => [] as Ev[]),
    getServices(true),
    getLiveSlides(),
    getHeroPanels(),
    getSettings(true),
    count("SELECT COUNT(*) AS n FROM ministries WHERE active = 1 AND photo_url != ''"),
    count('SELECT COUNT(*) AS n FROM ministries WHERE active = 1'),
    one<{ photo_url: string }>("SELECT photo_url FROM leaders WHERE active = 1 AND lower(role) LIKE '%resident pastor%' LIMIT 1").catch(() => null),
  ]);
  const groups = groupByDay(services);

  // The next service to happen, in Nashville time.
  const nowIso = new Date().toISOString();
  let next: { day: string; label: string; start: string; iso: string } | null = null;
  for (const s of services) {
    const minutes = parseClock(s.start_time);
    if (minutes == null) continue;
    for (const w of DAY_INDEX[s.day] ?? []) {
      for (const date of upcomingDates(w, 2)) {
        const iso = centralToIso(date, minutes);
        if (iso > nowIso && (!next || iso < next.iso)) next = { day: s.day, label: s.label || `${s.day} service`, start: s.start_time, iso };
      }
    }
  }
  const nextIn = next ? Math.round((Date.parse(next.iso) - Date.now()) / 3_600_000) : 0;
  const nextWhen = !next ? '' : nextIn < 1 ? 'starting now' : nextIn < 24 ? `in ${nextIn} h` : `in ${Math.round(nextIn / 24)} day${Math.round(nextIn / 24) === 1 ? '' : 's'}`;
  const nextPanel = next ? panels.find((p) => p.day === next!.day) : undefined;
  const dateLine = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  const stats: { label: string; value: number; sub: string; href: string; Icon: LucideIcon; accent?: boolean }[] = [
    { label: 'New submissions', value: newSubs, sub: `${openSubs} open in the inbox`, href: '/admin/inbox', Icon: InboxIcon, accent: newSubs > 0 },
    { label: 'Upcoming events', value: upcomingEvents, sub: nextEvents[0] ? `Next on ${longDate(nextEvents[0].starts_on).replace(/, \d{4}$/, '')}` : 'Nothing scheduled yet', href: '/admin/events', Icon: Calendar },
    { label: 'Special flyers live', value: slides.length, sub: `${groups.length} service days on the homepage`, href: '/admin/hero', Icon: ImageIcon },
    { label: 'Services a week', value: services.length, sub: groups.map((g) => g.day).join(' · ') || 'None set', href: '/admin/services', Icon: Clock },
  ];

  const photoSlots = ['focus', 'mandate', 'about', 'nations'].filter((k) => settings[`photo_${k}_url` as keyof typeof settings]).length;
  const checks: { label: string; ok: boolean; note: string; href: string; Icon: LucideIcon }[] = [
    { label: 'Email notifications', ok: notifyConfigured(), note: notifyConfigured() ? 'Form submissions reach the office inbox' : 'Add the mail keys to the server', href: '/admin/inbox', Icon: Mail },
    { label: 'AI drafting and flyers', ok: openaiConfigured() && Boolean(textProvider()), note: openaiConfigured() ? 'Generate flyers, events and summaries' : 'Add OPENAI_API_KEY to turn it on', href: '/admin/hero/new', Icon: Sparkles },
    { label: 'Hero video', ok: Boolean(settings.hero_video_url), note: settings.hero_video_url ? 'Playing behind the homepage headline' : 'Upload a short clip under Settings', href: '/admin/settings', Icon: Clapperboard },
    { label: 'Pastor photo', ok: Boolean(pastor?.photo_url), note: pastor?.photo_url ? 'Shown in the welcome block' : 'Add a photo under Leaders', href: '/admin/leaders', Icon: UserRound },
    { label: 'Ministry photos', ok: ministriesTotal > 0 && ministriesWithPhoto === ministriesTotal, note: `${ministriesWithPhoto} of ${ministriesTotal} ministries have a photo`, href: '/admin/ministries', Icon: Images },
    { label: 'Site photos', ok: photoSlots === 4, note: `${photoSlots} of 4 photo slots filled`, href: '/admin/settings', Icon: ImageIcon },
  ];
  const done = checks.filter((c) => c.ok).length;

  return (
    <>
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-light text-muted">{dateLine}</span>
          <h1 className="text-[26px] font-medium text-ink">{greeting()}, {(me?.name ?? 'there').split(' ').slice(0, 2).join(' ')}</h1>
          <p className="text-[14px] font-light text-muted">Here is what is happening on the website right now.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/hero/new" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-[14px] font-medium text-white no-underline transition-colors hover:bg-accent-dark"><ImagePlus size={16} aria-hidden="true" />Add a flyer</Link>
          <Link href="/admin/events/new" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-4 text-[14px] font-medium text-ink no-underline transition-colors hover:border-ink"><CalendarPlus size={16} aria-hidden="true" />Add an event</Link>
          <Link href="/admin/messages/new" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-4 text-[14px] font-medium text-ink no-underline transition-colors hover:border-ink"><ListPlus size={16} aria-hidden="true" />Add a message</Link>
        </div>
      </div>

      <Flash ok={sp.ok} error={sp.error} />

      {/* Numbers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group flex items-start gap-4 rounded-2xl border border-line bg-white p-5 no-underline transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-18px_rgba(20,20,22,0.3)]">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.accent ? 'bg-accent/10 text-accent' : 'bg-paper-2 text-[#6b6b73]'}`}><s.Icon size={20} aria-hidden="true" /></span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[13px] font-light text-muted">{s.label}</span>
              <span className={`tabular text-[30px] font-medium leading-tight ${s.accent ? 'text-accent' : 'text-ink'}`}>{s.value}</span>
              <span className="truncate text-[12.5px] font-light text-muted">{s.sub}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-6">
          {/* Next service */}
          {next && (
            <section className="rounded-2xl border border-line bg-white">
              <div className="flex flex-wrap items-center gap-5 p-5">
                {nextPanel?.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={nextPanel.image.url} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover ring-1 ring-black/5" />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent/10 px-2.5 py-1 text-[12px] font-medium text-accent"><Clock size={13} aria-hidden="true" />Next service · {nextWhen}</span>
                  <span className="mt-1 text-[20px] font-medium leading-tight text-ink">{next.label}</span>
                  <span className="text-[13.5px] font-light text-muted">{next.day} at {next.start}{nextPanel?.special ? ' · a special flyer is live' : ' · the fallback flyer is showing'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/admin/hero" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[13px] font-medium text-ink no-underline transition-colors hover:border-ink">Flyers <ArrowRight size={14} aria-hidden="true" /></Link>
                  <Link href="/admin/services" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-[13px] font-medium text-ink no-underline transition-colors hover:border-ink">Service times <ArrowRight size={14} aria-hidden="true" /></Link>
                </div>
              </div>
            </section>
          )}

          {/* Recent submissions */}
          <section className="rounded-2xl border border-line bg-white">
            <header className="flex items-center justify-between gap-3 px-6 py-4">
              <div className="flex flex-col">
                <h2 className="text-[16px] font-medium text-ink">Recent submissions</h2>
                <span className="text-[13px] font-light text-muted">Prayer requests, visit plans, contact and testimonies</span>
              </div>
              <Link href="/admin/inbox" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent no-underline">Open inbox <ArrowRight size={14} aria-hidden="true" /></Link>
            </header>
            {recent.length === 0 ? (
              <div className="px-6 pb-6"><Empty title="No submissions yet" text="When someone fills in a form on the website, it appears here and in the Inbox." /></div>
            ) : (
              <ul className="flex flex-col border-t border-[#f0f0f2]">
                {recent.map((r) => {
                  const I = formIcons[r.type];
                  const isNew = r.status === 'new';
                  return (
                    <li key={r.id}>
                      <Link href={`/admin/submissions/${r.id}`} className="flex items-center gap-4 px-6 py-3.5 no-underline transition-colors hover:bg-[#fafafa]">
                        <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-medium ${isNew ? 'bg-accent/10 text-accent' : 'bg-paper-2 text-[#6b6b73]'}`}>
                          {initials(r.name || 'Anonymous')}
                          {isNew && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-white" aria-label="New" />}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className={`truncate text-[14.5px] ${isNew ? 'font-medium text-ink' : 'text-ink'}`}>{r.name || 'Anonymous'}</span>
                          <span className="truncate text-[12.5px] font-light text-muted">{r.email || 'No email given'}</span>
                        </span>
                        <span className="hidden items-center gap-1.5 rounded-full bg-paper-2 px-2.5 py-1 text-[12px] text-[#5f5f66] sm:inline-flex">{I && <I size={13} aria-hidden="true" />}{FORM_LABELS[r.type as keyof typeof FORM_LABELS] ?? r.type}</span>
                        <span className="w-20 shrink-0 text-right text-[12.5px] font-light text-muted">{ago(r.created_at)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Homepage flyers */}
          <section className="rounded-2xl border border-line bg-white">
            <header className="flex items-center justify-between gap-3 px-6 py-4">
              <h2 className="text-[16px] font-medium text-ink">Homepage flyers</h2>
              <Link href="/admin/hero" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent no-underline">Manage <ArrowRight size={14} aria-hidden="true" /></Link>
            </header>
            <ul className="grid grid-cols-3 gap-5 border-t border-[#f0f0f2] p-6">
              {panels.map((p) => (
                <li key={p.day} className="flex flex-col gap-2">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image.url} alt="" className="aspect-square w-full rounded-lg object-cover ring-1 ring-black/5" />
                  ) : (
                    <span className="flex aspect-square w-full items-center justify-center rounded-lg bg-paper-2 text-[11px] text-muted">none</span>
                  )}
                  <span className="truncate text-[13.5px] text-ink">{p.day}</span>
                  <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] ${p.special ? 'bg-[#eaf7ee] text-[#1b5e35]' : 'bg-paper-2 text-[#5f5f66]'}`}><span className={`h-1.5 w-1.5 rounded-full ${p.special ? 'bg-[#2e9e5b]' : 'bg-[#a8a8ae]'}`} />{p.special ? 'Special' : 'Fallback'}</span>
                </li>
              ))}
            </ul>
          </section>

        </div>

        <div className="flex flex-col gap-6">
          {/* Coming up */}
          <section className="rounded-2xl border border-line bg-white">
            <header className="flex items-center justify-between gap-3 px-6 py-4">
              <h2 className="text-[16px] font-medium text-ink">Coming up</h2>
              <Link href="/admin/events" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent no-underline">All events <ArrowRight size={14} aria-hidden="true" /></Link>
            </header>
            {nextEvents.length === 0 ? (
              <div className="px-6 pb-6"><Empty title="No upcoming events" action={{ href: '/admin/events/new', label: 'Add an event' }} /></div>
            ) : (
              <ul className="flex flex-col border-t border-[#f0f0f2]">
                {nextEvents.map((e) => {
                  const d = monthDay(e.starts_on);
                  return (
                    <li key={e.id}>
                      <Link href={`/admin/events/${e.id}`} className="flex items-center gap-4 px-6 py-3 no-underline transition-colors hover:bg-[#fafafa]">
                        <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-paper-2 leading-none">
                          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-accent">{d.month}</span>
                          <span className="tabular text-[18px] font-medium text-ink">{d.day}</span>
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-[14.5px] text-ink">{e.title}</span>
                          <span className="truncate text-[12.5px] font-light text-muted">{e.detail || longDate(e.starts_on)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Site readiness */}
          <section className="rounded-2xl border border-line bg-white">
            <header className="flex items-center justify-between gap-3 px-6 py-4">
              <div className="flex flex-col">
                <h2 className="text-[16px] font-medium text-ink">Site readiness</h2>
                <span className="text-[13px] font-light text-muted">{done} of {checks.length} in place</span>
              </div>
              <span className="tabular text-[13px] font-light text-muted">{Math.round((done / checks.length) * 100)}%</span>
            </header>
            <div className="mx-6 h-1.5 overflow-hidden rounded-full bg-paper-2"><div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${(done / checks.length) * 100}%` }} /></div>
            <ul className="flex flex-col p-3 pt-4">
              {checks.map((c) => (
                <li key={c.label}>
                  <Link href={c.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 no-underline transition-colors hover:bg-[#fafafa]">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${c.ok ? 'bg-[#eaf7ee] text-[#2e9e5b]' : 'bg-paper-2 text-[#a8a8ae]'}`}>{c.ok ? <Check size={14} aria-hidden="true" /> : <c.Icon size={14} aria-hidden="true" />}</span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[13.5px] text-ink">{c.label}</span>
                      <span className="truncate text-[12px] font-light text-muted">{c.note}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

        </div>
      </div>
    </>
  );
}
