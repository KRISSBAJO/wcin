'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

export interface HeroPanel {
  image: { url: string; alt: string; link: string } | null;
  card: { eyebrow: string; times: { value: string; label: string }[] };
}

interface Props {
  panels: HeroPanel[];
}

/** The right-hand hero column: one panel per slide, image on top, that slide's service card below. */
export default function HeroSlides({ panels }: Props) {
  const [index, setIndex] = useState(0);
  const timer = useRef<number | null>(null);
  const many = panels.length > 1;

  const stop = () => { if (timer.current) window.clearInterval(timer.current); timer.current = null; };
  const start = () => {
    stop();
    if (!many || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timer.current = window.setInterval(() => setIndex((i) => (i + 1) % panels.length), 6000);
  };
  const go = (n: number) => { setIndex((n + panels.length) % panels.length); start(); };

  useEffect(() => { start(); return stop; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panels.length]);

  return (
    <div className="relative h-full" onMouseEnter={stop} onMouseLeave={start}>
      {panels.map((p, i) => {
        const active = i === index;
        const Media = p.image?.link ? 'a' : 'div';
        return (
          <div
            key={i}
            aria-hidden={active ? undefined : true}
            className={`flex min-h-0 flex-col gap-3 transition-opacity duration-500 lg:h-full lg:justify-center ${active ? 'relative visible opacity-100' : 'invisible absolute inset-0 opacity-0'}`}
          >
            <Media
              href={p.image?.link || undefined}
              className={`relative flex min-h-0 w-full justify-center overflow-hidden rounded-lg text-white no-underline shadow-[0_36px_70px_-24px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.08)] transition-transform duration-500 hover:-translate-y-0.5 ${p.image ? 'bg-ink-2 lg:flex-[0_1_auto]' : 'aspect-square bg-ink-2 lg:aspect-auto lg:flex-1'}`}
            >
              {p.image ? (
                // The box takes the flyer's own shape: full width on phones, shrunk to the available height on desktop. Never cropped.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image.url} alt={p.image.alt} className="block h-auto w-full lg:h-auto lg:max-h-full lg:w-auto lg:max-w-full" loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
              ) : (
                <span className="placeholder-box absolute inset-0">[Add a hero image in Admin → Hero]</span>
              )}
              {many && (
                <span className="group/controls absolute inset-0 z-10">
                  {/* Arrows stay hidden until the image is hovered or a control has focus. */}
                  <button type="button" aria-label="Previous slide" onClick={(e) => { e.preventDefault(); go(index - 1); }} className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/40 text-white opacity-0 transition-opacity hover:bg-ink/70 focus-visible:opacity-100 group-hover/controls:opacity-100"><Icon name="chevron" size={18} className="-scale-x-100" /></button>
                  <button type="button" aria-label="Next slide" onClick={(e) => { e.preventDefault(); go(index + 1); }} className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/40 text-white opacity-0 transition-opacity hover:bg-ink/70 focus-visible:opacity-100 group-hover/controls:opacity-100"><Icon name="chevron" size={18} /></button>
                  <span className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
                    {panels.map((_, d) => (
                      <button key={d} type="button" aria-label={`Slide ${d + 1}`} onClick={(e) => { e.preventDefault(); go(d); }} className={`h-1.5 rounded-full transition-all ${d === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`} />
                    ))}
                  </span>
                </span>
              )}
            </Media>
            {/* Service strip: a compact tag under the poster, not a second block competing with it. */}
            <div className="mx-auto flex w-[calc(100%-32px)] shrink-0 flex-wrap items-center gap-x-6 gap-y-2 rounded-md bg-white/95 px-5 py-3.5 text-ink shadow-[0_16px_40px_-20px_rgba(0,0,0,0.6)] backdrop-blur">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{p.card.eyebrow}</span>
              <span className="hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
              {p.card.times.map((t, k) => (
                <span key={k} className="flex items-baseline gap-2">
                  <span className="whitespace-nowrap font-display text-[26px] leading-none">{t.value}</span>
                  <span className="text-[12px] text-muted">{t.label}</span>
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
