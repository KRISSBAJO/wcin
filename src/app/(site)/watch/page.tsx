import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import Icon from '@/components/Icon';
import { FileDown } from 'lucide-react';
import { site } from '@/data/site';
import { getRecentMessages, getServices, getSettings } from '@/lib/content';
import { longDate, youtubeEmbedUrl, youtubeThumb } from '@/lib/dates';

export const metadata: Metadata = {
  title: 'Watch',
  description: `Watch ${site.name} live on Sundays, and catch up on recent messages.`,
};

export default async function WatchPage() {
  const [messages, settings, services] = await Promise.all([getRecentMessages(8), getSettings(), getServices()]);
  const sunday = services.filter((s) => s.day === 'Sunday');
  const liveStreamUrl = settings.live_stream_url || site.liveStreamUrl;
  const embed = youtubeEmbedUrl(liveStreamUrl);
  return (
    <>
      <PageHero eyebrow="Watch" title="Join us live" lead={`We stream our Sunday service, ${sunday.map((s) => s.time).join(' and ')} Central Time. Can't make it in person? You are still part of the family.`}>
        <div className="flex flex-col gap-3 bg-white p-7 text-ink">
          <span className="eyebrow">Next live stream</span>
          <span className="font-display text-[44px] leading-none">Sunday {sunday[0]?.time ?? ''}</span>
          <span className="text-[15px] text-body">Central Time · Stream opens 10 minutes before</span>
          <a href={liveStreamUrl} className="btn btn-primary btn-small" rel="noopener" target="_blank"><Icon name="play" size={14} />Watch live</a>
        </div>
      </PageHero>

      <section className="section" id="live">
        <div className="wrap flex flex-col gap-5">
          {embed ? (
            <iframe
              src={embed}
              title="Winners Chapel Nashville live stream"
              className="aspect-video w-full border-0 bg-ink"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-ink text-white">
              <p className="text-lg text-muted-dark">The stream opens on YouTube.</p>
              <a href={liveStreamUrl} className="btn btn-primary" rel="noopener" target="_blank"><Icon name="play" size={16} />Watch live</a>
            </div>
          )}
          <p className="body-copy">Also streaming from headquarters: <a href="https://media.faithtabernacle.org.ng/" rel="noopener" target="_blank">Faith Tabernacle, Canaanland</a> in English, Yoruba and French, plus DOMI Radio.</p>
        </div>
      </section>

      <section className="section bg-paper-2" id="messages">
        <div className="wrap">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-3"><span className="eyebrow">Catch up</span><h2 className="h-section">Recent messages</h2></div>
            <a href={site.social.youtube} className="inline-flex items-center gap-2 border-b-2 border-ink pb-1 text-base font-bold uppercase tracking-[0.04em] text-ink no-underline" rel="noopener" target="_blank"><Icon name="youtube" size={18} />YouTube channel</a>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {messages.map((m) => (
              <a key={m.id} href={m.video_url || '#live'} className="group flex min-w-0 flex-col gap-2.5 text-sm text-ink no-underline" rel="noopener" target={m.video_url ? '_blank' : undefined}>
                <span className="relative flex aspect-video items-center justify-center overflow-hidden bg-ink-2 text-white">
                  {youtubeThumb(m.video_url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={youtubeThumb(m.video_url)!} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  )}
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-ink"><Icon name="play" size={20} /></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{longDate(m.preached_on)}</span>
                <span className="font-display text-[28px] leading-none group-hover:text-accent">{m.title}</span>
                {m.description && <span className="text-[15px] leading-[1.5] text-body">{m.description}</span>}
                <span className="text-muted">{m.speaker}{m.length && ` · ${m.length}`}</span>
              </a>
            ))}
            {messages.length === 0 && <p className="body-copy">Messages will appear here after the next service.</p>}
          </div>
        </div>
      </section>

      <section className="section" id="focus">
        <div className="wrap grid grid-cols-12 items-center gap-x-6 gap-y-10">
          <div className="col-span-12 flex flex-col gap-5 lg:col-span-6">
            <span className="eyebrow">Prophetic focus · {settings.focus_month}</span>
            <h2 className="h-section">“{settings.focus_text}”</h2>
            <p className="text-xl">{settings.focus_scripture}</p>
            <p className="body-copy">Each month the church worldwide holds one prophetic focus. Download the guide and pray along with the family.</p>
            <a href={settings.focus_pdf} className="btn btn-dark sm:self-start" rel="noopener" target="_blank"><FileDown size={16} aria-hidden="true" />Download the PDF</a>
          </div>
          <div className="col-span-12 lg:col-span-6">
            {settings.photo_focus_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.photo_focus_url} alt={`Prophetic focus, ${settings.focus_month}`} className="w-full rounded-sm bg-paper-2 object-cover shadow-[0_24px_48px_-24px_rgba(20,20,22,0.4)]" loading="lazy" />
            ) : (
              <div className="placeholder-box placeholder-box-light aspect-[4/3]">[Prophetic focus artwork]</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
