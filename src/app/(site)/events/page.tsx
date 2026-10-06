import type { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import ServiceTimes from '@/components/ServiceTimes';
import { site } from '@/data/site';
import { getUpcomingEvents } from '@/lib/content';
import { monthDay, longDate } from '@/lib/dates';
import { CalendarRange, MessageCircleQuestion } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Events',
  description: `Upcoming events at ${site.name}: special services, Believers' Foundation Class, WOFBI and Shiloh.`,
};

export default async function EventsPage() {
  const events = await getUpcomingEvents();
  return (
    <>
      <PageHero eyebrow="Events" title="What's coming up" lead="Special services, classes and gatherings. Weekly services are listed at the bottom." />

      <section className="section">
        <div className="wrap flex flex-col border-t border-line">
          {events.map((e) => {
            const d = monthDay(e.starts_on);
            return (
              <article key={e.id} className={`grid grid-cols-[72px_minmax(0,1fr)] items-center gap-6 border-b border-line py-8 ${e.image_url ? 'md:grid-cols-[96px_160px_minmax(0,1fr)_auto]' : 'md:grid-cols-[96px_minmax(0,1fr)_auto]'}`}>
                <time className="flex flex-col items-center" dateTime={e.starts_on}>
                  <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-accent">{d.month}</span>
                  <span className="font-display text-5xl leading-none md:text-[64px]">{d.day}</span>
                </time>
                {e.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.image_url} alt="" className="col-span-2 aspect-square w-full max-w-[220px] rounded-sm bg-paper-2 object-cover md:col-span-1 md:w-40" loading="lazy" />
                )}
                <div className="flex min-w-0 flex-col gap-2">
                  <h2 className="text-[30px] leading-none lg:text-[40px]">{e.title}</h2>
                  <p className="body-copy">{e.detail}</p>
                  {e.ends_on && e.ends_on !== e.starts_on && <p className="flex items-center gap-2 text-muted"><CalendarRange size={16} aria-hidden="true" />{longDate(e.starts_on)} to {longDate(e.ends_on)}</p>}
                </div>
                <Link href="/contact" className="btn btn-outline btn-small col-start-2 justify-self-start md:col-start-auto"><MessageCircleQuestion size={16} aria-hidden="true" />Ask a question</Link>
              </article>
            );
          })}
          {events.length === 0 && <p className="body-copy py-8">No upcoming events yet. Our weekly services continue as usual.</p>}
        </div>
      </section>

      <section className="section bg-paper-2">
        <div className="wrap flex flex-col gap-5">
          <div className="flex flex-col gap-3"><span className="eyebrow">Every week</span><h2 className="h-section">Regular services</h2></div>
          <ServiceTimes />
        </div>
      </section>
    </>
  );
}
