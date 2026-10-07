import Link from 'next/link';
import Icon, { type IconName } from '@/components/Icon';
import CountUp from '@/components/CountUp';
import { Building2, CalendarDays, FileDown, Globe, HandHeart, Percent, Smartphone, type LucideIcon } from 'lucide-react';
import { site, quickActions } from '@/data/site';
import { mapEmbedSrc } from '@/lib/map';
import { getUpcomingEvents, getRecentMessages, getSettings, getServices, getHeroPanels, getMinistries, getLeaders, groupByDay } from '@/lib/content';
import { monthDay, longDate, weekday, youtubeThumb } from '@/lib/dates';

export default async function HomePage() {
  const [events, messages, settings, services, heroPanels, ministries, leaders] = await Promise.all([
    getUpcomingEvents(3), getRecentMessages(4), getSettings(), getServices(), getHeroPanels(), getMinistries(), getLeaders(),
  ]);
  const serviceDays = groupByDay(services);
  const sundayStart = services.find((s) => s.day === 'Sunday')?.start_time ?? services[0]?.start_time ?? '';
  const streetOnly = site.address.street.replace(/,?\s*(suite|ste\.?|unit|#)\s*\S+$/i, '');
  const pastor = leaders.find((l) => /resident pastor/i.test(l.role)) ?? leaders.find((l) => !/bishop/i.test(l.role)) ?? leaders[0];
  const welcomeParagraphs = settings.welcome_text.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
  const [featured, ...rest] = messages;

  return (
    <>
      {/* Hero: fills the first screen on desktop. With a clip uploaded under Settings it plays silently behind the words. */}
      <section className="relative overflow-hidden bg-ink text-white">
        {settings.hero_video_url && (
          <div className="absolute inset-0 motion-reduce:hidden" aria-hidden="true">
            {settings.hero_video_poster_url && (
              // The poster also sits behind the video as a real image, so the first paint is never a blank block.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.hero_video_poster_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <video src={settings.hero_video_url} poster={settings.hero_video_poster_url || undefined} autoPlay muted loop playsInline preload="auto" className="hero-video relative h-full w-full object-cover" />
            {/* One scene edge to edge: dark where the words sit, open where the faces are, settled at the bottom. */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,20,22,0.9)_0%,rgba(20,20,22,0.72)_36%,rgba(20,20,22,0.38)_62%,rgba(20,20,22,0.3)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink/95 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-ink/60 to-transparent" />
          </div>
        )}
        <div className="wrap relative grid grid-cols-12 items-center gap-x-6 gap-y-0 lg:h-[min(74svh,760px)] lg:min-h-[540px] lg:py-10">
          {/* Words only: the video owns the first screen, and the flyers follow in the band below. */}
          <div className="hero-rise col-span-12 flex min-h-[70svh] min-w-0 flex-col justify-center gap-6 py-12 lg:col-span-7 lg:min-h-0 lg:py-0">
            <span className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-gold"><span className="h-0.5 w-8 bg-gold" />Welcome home</span>
            <h1 className="text-[64px] leading-[0.9] drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)] md:text-[96px] lg:text-[clamp(72px,8vw,120px)]">A church<br />where winners<br />are made</h1>
            <p className="max-w-[520px] text-lg leading-[1.5] text-[#e4e4e8] lg:text-[22px]">Whoever you are, there is a seat for you this Sunday.</p>
            <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Link href="/visit" className="btn btn-primary"><CalendarDays size={16} aria-hidden="true" />Plan your visit</Link>
              <Link href="/watch" className="btn btn-outline-light"><Icon name="play" size={16} />Watch online</Link>
            </div>
            <span className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] font-bold uppercase tracking-[0.18em] text-gold/90">
              {sundayStart && <span className="flex items-center gap-1.5"><Icon name="clock" size={14} />Sundays {sundayStart}</span>}
              <span className="flex items-center gap-1.5"><Icon name="pin" size={14} />{streetOnly}, {site.address.city}</span>
            </span>
          </div>
        </div>
        <a href="#at-a-glance" aria-label="Scroll to services, location and contact" className="hero-cue absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-white/80 no-underline hover:text-white lg:block">
          <Icon name="chevron" size={28} className="rotate-90" />
        </a>
      </section>

      {/* At-a-glance strip: the three things a visitor wants to know */}
      <section id="at-a-glance" className="scroll-mt-4 border-b border-line bg-white" aria-label="Services, location and contact">
        <div className="wrap grid grid-cols-1 divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0" data-reveal-group>
          <div className="flex gap-4 py-7 md:pr-8">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"><Icon name="clock" size={20} /></span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="eyebrow">Services</span>
              {serviceDays.map((g) => (
                <span key={g.day} className="text-[15px] leading-snug text-body"><strong className="font-semibold text-ink">{g.day}</strong> · {g.services.map((s) => s.start_time).join(' and ')}</span>
              ))}
              <Link href="/visit" className="text-link mt-1 text-[14px]">Plan a visit <Icon name="arrow" size={14} /></Link>
            </div>
          </div>
          <div className="flex gap-4 py-7 md:px-8">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"><Icon name="pin" size={20} /></span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="eyebrow">Location</span>
              <span className="text-[15px] leading-snug text-body"><strong className="font-semibold text-ink">{site.address.street}</strong><br />{site.address.city}, {site.address.state} {site.address.zip}</span>
              <a href={site.mapLinkUrl} className="text-link mt-1 text-[14px]" rel="noopener" target="_blank">Get directions <Icon name="arrow" size={14} /></a>
            </div>
          </div>
          <div className="flex gap-4 py-7 md:pl-8">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"><Icon name="phone" size={20} /></span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="eyebrow">Contact</span>
              <a href={site.phoneHref} className="text-[15px] font-semibold leading-snug text-ink no-underline hover:text-accent">{site.phone}</a>
              <a href={`mailto:${site.email}`} className="break-all text-[15px] leading-snug text-body no-underline hover:text-accent">{site.email}</a>
              <Link href="/contact" className="text-link mt-1 text-[14px]">Send a message <Icon name="arrow" size={14} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* This week: every service-day flyer side by side, with a special flyer standing out when one is live */}
      <section className="section home-section bg-paper-2" id="this-week" aria-label="This week">
        <div className="wrap">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6" data-reveal>
            <div className="flex flex-col gap-3"><span className="eyebrow">This week</span><h2 className="h-section">Join us this week</h2></div>
            <Link href="/visit" className="inline-flex items-center gap-1.5 border-b-2 border-ink pb-1 text-base font-bold uppercase tracking-[0.04em] text-ink no-underline">Plan a visit <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-reveal-group>
            {heroPanels.map((p) => {
              const media = (
                <>
                  {p.image ? (
                    // Flyers keep their own shape; nothing is cropped.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image.url} alt={p.image.alt} className="block h-auto w-full" loading="lazy" decoding="async" />
                  ) : (
                    <span className="placeholder-box block aspect-square">[Add a flyer in Admin → Hero]</span>
                  )}
                  {p.special && <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow">Special</span>}
                </>
              );
              const mediaCls = 'relative block bg-white no-underline';
              return (
                <article key={p.day} className={`flex min-w-0 flex-col overflow-hidden rounded-lg bg-white shadow-[0_24px_48px_-28px_rgba(20,20,22,0.35)] ring-1 ring-black/5 transition-transform duration-300 hover:-translate-y-1 ${p.special ? 'ring-2 ring-accent' : ''}`}>
                  {p.image?.link ? <Link href={p.image.link} className={mediaCls}>{media}</Link> : <div className={mediaCls}>{media}</div>}
                  <div className="flex flex-col gap-2 px-5 py-4">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{p.card.eyebrow}</span>
                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                      {p.card.times.map((t, k) => (
                        <span key={k} className="flex items-baseline gap-2">
                          <span className="whitespace-nowrap font-display text-[30px] leading-none text-ink">{t.value}</span>
                          <span className="text-[13px] text-muted">{t.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
            {heroPanels.length === 0 && <p className="body-copy">Service times are listed below.</p>}
          </div>
        </div>
      </section>

      {/* Welcome from the pastor */}
      {welcomeParagraphs.length > 0 && pastor && (
        <section className="section home-section bg-paper-2" id="welcome">
          <div className="wrap grid grid-cols-12 items-center gap-x-6 gap-y-10">
            <div className="col-span-12 md:col-span-5 lg:col-span-4" data-reveal="left">
              <div className="relative mx-auto max-w-[420px]">
                <span className="absolute -left-3 -top-3 h-full w-full rounded-sm bg-accent" aria-hidden="true" />
                {pastor.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pastor.photo_url} alt={pastor.name} className="relative aspect-[4/5] w-full rounded-sm bg-white object-cover object-top shadow-[0_24px_48px_-24px_rgba(20,20,22,0.45)]" loading="lazy" />
                ) : (
                  <div className="placeholder-box relative aspect-[4/5]">[Photo of {pastor.name}]</div>
                )}
              </div>
            </div>
            <div className="col-span-12 flex flex-col gap-5 md:col-span-7 lg:col-span-7 lg:col-start-6" data-reveal-group>
              <span className="eyebrow">A word from the pastor</span>
              <h2 className="h-section">{settings.welcome_title}</h2>
              {welcomeParagraphs.map((t) => <p key={t.slice(0, 40)} className="body-copy max-w-[600px]">{t}</p>)}
              <div className="mt-1 flex flex-col gap-0.5">
                <span className="font-display text-[30px] leading-none tracking-[0.02em] text-ink">{pastor.name}</span>
                <span className="text-[13px] font-bold uppercase tracking-[0.16em] text-accent">{pastor.role}</span>
              </div>
              <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <Link href="/visit" className="btn btn-primary"><CalendarDays size={16} aria-hidden="true" />Plan your visit</Link>
                <Link href="/about#leadership" className="btn btn-outline">Meet the team</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section className="border-b border-line bg-line" aria-label="Quick links">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-px lg:grid-cols-4" data-reveal-group>
          {quickActions.map((q) => (
            <Link key={q.title} href={q.href} className="group flex min-w-0 flex-col gap-3 bg-white p-5 text-ink no-underline transition-colors hover:bg-paper-2 hover:text-ink lg:px-10 lg:py-8">
              <Icon name={q.icon as IconName} size={28} className="text-accent transition-transform duration-300 group-hover:-translate-y-0.5" />
              <span className="font-display text-[22px] leading-none tracking-[0.02em] lg:text-[28px]">{q.title}</span>
              <span className="hidden text-[15px] leading-[1.5] text-muted sm:block">{q.text}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Mandate */}
      <section className="section home-section" id="about">
        <div className="wrap grid grid-cols-12 items-start gap-x-6 gap-y-10">
          {settings.photo_mandate_url && (
            <figure className="col-span-12 overflow-hidden rounded-sm bg-[radial-gradient(ellipse_at_center,_#9c1119_0%,_#6e0a10_60%,_#4a070b_100%)] shadow-[0_28px_56px_-28px_rgba(20,20,22,0.55)]" data-reveal>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.photo_mandate_url} alt="The Liberation Mandate" className="aspect-[2000/750] w-full object-contain" loading="lazy" />
            </figure>
          )}
          <div className="col-span-12 flex flex-col gap-5 lg:col-span-5" data-reveal-group>
            <span className="eyebrow">The mandate</span>
            <h2 className="text-[48px] lg:text-[72px]">Liberating people through the word of faith</h2>
          </div>
          <div className="col-span-12 flex flex-col gap-6 lg:col-span-7" data-reveal-group>
            <blockquote className="border-l-4 border-accent pl-5 text-xl italic leading-[1.45] lg:text-2xl">“The hour has come to liberate the world from all oppressions of the devil through the preaching of the word of faith.”</blockquote>
            <p className="body-copy">{site.name} is a branch of {site.parent}, founded by {site.founder} in 1983. We are part of a global family of churches across more than 150 nations, all carrying the same commission.</p>
            <p className="body-copy">Here in Middle Tennessee we preach faith, teach the Word, pray together, and raise people who prosper in every area of life. Our doors are open to everyone.</p>
            <div className="mt-2 grid grid-cols-2 gap-6 sm:grid-cols-3">
              {[['1983', 'Living Faith Church founded'], ['150+', 'Nations with a Winners church'], [site.plantedYear, 'Nashville church planted']].map(([v, l]) => (
                <div key={l} className="flex flex-col gap-1 text-sm text-muted"><CountUp value={v} className="font-display text-5xl leading-none text-ink" />{l}</div>
              ))}
            </div>
            <Link href="/about" className="text-link self-start">Our story and leadership <Icon name="arrow" size={18} /></Link>
          </div>
        </div>
      </section>

      {/* Watch */}
      <section className="section home-section bg-paper-2" id="watch">
        <div className="wrap">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6" data-reveal>
            <div className="flex flex-col gap-3"><span className="eyebrow">Watch</span><h2 className="h-section">Latest messages</h2></div>
            <Link href="/watch" className="inline-flex items-center gap-1.5 border-b-2 border-ink pb-1 text-base font-bold uppercase tracking-[0.04em] text-ink no-underline">All messages <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="grid grid-cols-12 gap-6" data-reveal-group>
            {featured && (
              <a href={featured.video_url || '/watch'} className="lift col-span-12 flex min-w-0 flex-col gap-4 text-ink no-underline hover:text-ink lg:col-span-7" rel="noopener" target={featured.video_url ? '_blank' : undefined}>
                <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-ink-2">
                  {youtubeThumb(featured.video_url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={youtubeThumb(featured.video_url)!} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                  )}
                  <span className="absolute inset-0 bg-ink/25" aria-hidden="true" />
                  <span className="absolute left-4 top-4 bg-accent px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white">Watch message</span>
                  <span className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white text-ink shadow-[0_12px_30px_rgba(0,0,0,0.35)]"><Icon name="play" size={26} /></span>
                </div>
                <span className="text-[13px] font-bold uppercase tracking-[0.16em] text-muted">{weekday(featured.preached_on)} · {longDate(featured.preached_on)}</span>
                <span className="font-display text-[28px] leading-none lg:text-4xl">{featured.title}</span>
                {featured.description && <span className="text-[16px] leading-[1.5] text-body">{featured.description}</span>}
                <span className="text-sm text-muted">{featured.speaker}{featured.length && ` · ${featured.length}`}</span>
              </a>
            )}
            <div className="col-span-12 flex flex-col gap-5 lg:col-span-5">
              {rest.slice(0, 3).map((m) => (
                <a key={m.id} href={m.video_url || '/watch'} className="flex min-h-11 items-center gap-4 text-ink no-underline hover:text-accent" rel="noopener" target={m.video_url ? '_blank' : undefined}>
                  <span className="relative flex aspect-video w-28 shrink-0 items-center justify-center overflow-hidden bg-ink-2 text-white sm:w-[148px]">
                    {youtubeThumb(m.video_url) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={youtubeThumb(m.video_url)!} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    ) : <Icon name="play" size={18} />}
                  </span>
                  <span className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{longDate(m.preached_on)}</span>
                    <span className="font-display text-[22px] leading-none sm:text-[26px]">{m.title}</span>
                  </span>
                </a>
              ))}
              <div className="mt-1 flex flex-col gap-2 bg-white px-6 py-5">
                <span className="eyebrow">Prophetic focus · {settings.focus_month}</span>
                <span className="text-lg font-semibold leading-[1.4]">“{settings.focus_text}” {settings.focus_scripture}</span>
                <a href={settings.focus_pdf} className="inline-flex items-center gap-1.5 text-[15px] font-bold" rel="noopener" target="_blank"><FileDown size={16} aria-hidden="true" />Download the month&apos;s prophetic focus (PDF)</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ministries */}
      <section className="section home-section" id="ministries">
        <div className="wrap">
          <div className="mb-12 flex max-w-[720px] flex-col gap-3" data-reveal><span className="eyebrow">Ministries</span><h2 className="h-section">A place for every age and every season</h2></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-reveal-group>
            {ministries.map((m) => (
              <Link key={m.id} href={`/ministries#${m.slug}`} className={`lift flex min-w-0 flex-col gap-3.5 overflow-hidden no-underline ${m.dark ? 'bg-ink text-white hover:bg-ink-2 hover:text-white' : 'bg-paper-2 text-ink hover:bg-[#ebebed] hover:text-ink'}`}>
                {m.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo_url} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
                )}
                <span className="flex flex-1 flex-col gap-3.5 p-5 sm:min-h-[220px] sm:px-8 sm:py-7">
                  <span className={`text-[13px] font-bold uppercase tracking-[0.16em] ${m.dark ? 'text-gold' : 'text-accent'}`}>{m.tag}</span>
                  <span className="font-display text-[30px] leading-none lg:text-[40px]">{m.title}</span>
                  <span className={`mt-auto text-base leading-[1.5] ${m.dark ? 'text-muted-dark' : 'text-body'}`}>{m.summary}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="section home-section bg-ink text-white" id="events">
        <div className="wrap">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6" data-reveal>
            <div className="flex flex-col gap-3"><span className="eyebrow text-gold">Coming up</span><h2 className="h-section">Events</h2></div>
            <Link href="/events" className="inline-flex items-center gap-1.5 border-b-2 border-white pb-1 text-base font-bold uppercase tracking-[0.04em] text-white no-underline">Full calendar <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" data-reveal-group>
            {events.map((e) => {
              const d = monthDay(e.starts_on);
              return (
                <article key={e.id} className="lift flex min-w-0 flex-col overflow-hidden border border-line-dark">
                  {e.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.image_url} alt="" className="aspect-[16/9] w-full object-cover object-top" loading="lazy" />
                  )}
                  <div className="flex min-w-0 gap-5 p-5 lg:gap-6 lg:p-8">
                    <div className="flex w-14 shrink-0 flex-col items-center lg:w-16"><span className="text-[13px] font-bold uppercase tracking-[0.14em] text-gold">{d.month}</span><span className="font-display text-5xl leading-none lg:text-[56px]">{d.day}</span></div>
                    <div className="flex flex-col gap-2"><h3 className="text-2xl leading-none lg:text-[30px]">{e.title}</h3><p className="text-[15px] leading-[1.5] text-muted-dark">{e.detail}</p></div>
                  </div>
                </article>
              );
            })}
            {events.length === 0 && <p className="body-copy">No upcoming events yet. Check back soon.</p>}
          </div>
        </div>
      </section>

      {/* Give */}
      <section className="section home-section" id="give">
        <div className="wrap grid grid-cols-12 items-center gap-x-6 gap-y-10">
          <div className="col-span-12 flex flex-col gap-5 lg:col-span-6" data-reveal-group>
            <span className="eyebrow">Giving</span>
            <h2 className="h-section">Partner with the work in Nashville</h2>
            <p className="body-copy max-w-[540px]">Tithes, offerings and project giving are secure and take under a minute. Give online, by text, or in person on Sunday.</p>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Link href="/give" className="btn btn-primary"><HandHeart size={16} aria-hidden="true" />Give online</Link>
              <Link href="/give#text" className="btn btn-outline"><Smartphone size={16} aria-hidden="true" />Text to give</Link>
            </div>
          </div>
          <div className="col-span-12 grid grid-cols-2 gap-4 lg:col-span-6" data-reveal-group>
            {([['Tithe', 'Monthly or weekly', Percent], ['Offering', 'General and thanksgiving', HandHeart], ['Building project', 'Nashville sanctuary fund', Building2], ['Missions', 'Mission adoption scheme', Globe]] as [string, string, LucideIcon][]).map(([t, s, I]) => (
              <div key={t} className="flex flex-col gap-1.5 bg-paper-2 p-6 text-sm text-muted"><I size={22} className="mb-1 text-accent" aria-hidden="true" /><span className="font-display text-[28px] leading-none text-ink">{t}</span>{s}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Find us */}
      <section className="section home-section bg-paper-2" id="contact">
        <div className="wrap grid grid-cols-12 items-stretch gap-x-6 gap-y-10">
          <div className="col-span-12 flex flex-col gap-6 lg:col-span-5" data-reveal-group>
            <span className="eyebrow">Find us</span>
            <h2 className="h-section">We&apos;d love to meet you this Sunday</h2>
            <address className="flex flex-col gap-3.5 text-[17px] not-italic leading-[1.5] text-body">
              <span className="flex min-h-11 gap-3.5"><Icon name="pin" size={22} className="mt-0.5 shrink-0 text-accent" /><span>{site.address.street}<br />{site.address.city}, {site.address.state} {site.address.zip}</span></span>
              <a className="flex min-h-11 gap-3.5 text-body no-underline" href={site.phoneHref}><Icon name="phone" size={22} className="mt-0.5 shrink-0 text-accent" /><span>{site.phone}</span></a>
              <a className="flex min-h-11 gap-3.5 text-body no-underline" href={`mailto:${site.email}`}><Icon name="mail" size={22} className="mt-0.5 shrink-0 text-accent" /><span>{site.email}</span></a>
            </address>
            <Link href="/visit" className="btn btn-dark sm:self-start"><CalendarDays size={16} aria-hidden="true" />Plan a visit</Link>
          </div>
          <div className="col-span-12 flex min-h-[260px] lg:col-span-7 lg:min-h-[420px]">
            {mapEmbedSrc() ? (
              <iframe src={mapEmbedSrc()!} title="Map to the church" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" width="720" height="420" className="block min-h-[300px] w-full flex-1 rounded-lg border-0 lg:min-h-[420px]" />
            ) : (
              <div className="placeholder-box placeholder-box-light flex-1">[Embedded map · Nashville location]</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
