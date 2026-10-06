import { Clock, MapPin, Info } from 'lucide-react';

// Two-column form layout: the form on the left, a branded panel on the right, like the
// headquarters' Typeform pages but on one screen. On phones the panel sits under the form.
interface Props {
  eyebrow: string;
  title: React.ReactNode;
  intro?: string;
  panel: {
    image?: string;
    eyebrow: string;
    title: string;
    lines: string[];
    note?: string;
  };
  children: React.ReactNode;
}

export default function FormSplit({ eyebrow, title, intro, panel, children }: Props) {
  return (
    <section className="section">
      <div className="wrap grid grid-cols-12 items-start gap-x-8 gap-y-10">
        <div className="col-span-12 flex flex-col gap-8 lg:col-span-7">
          <div className="flex flex-col gap-4">
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="text-[52px] leading-[0.95] md:text-[64px] lg:text-[72px]">{title}</h1>
            {intro && <p className="body-copy max-w-[560px]">{intro}</p>}
          </div>
          {children}
        </div>
        <aside className="col-span-12 lg:col-span-5 lg:sticky lg:top-6">
          <div className="bg-ink text-white">
            {panel.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={panel.image} alt="" className="block h-auto w-full" />
            ) : (
              <div className="placeholder-box aspect-square w-full">[Flyer]</div>
            )}
            <div className="flex flex-col gap-2 px-7 py-6">
              <span className="eyebrow text-gold">{panel.eyebrow}</span>
              <p className="font-display text-[36px] leading-none">{panel.title}</p>
              <ul className="mt-1 flex flex-col gap-1 text-[15px] text-muted-dark">
                {panel.lines.map((l, i) => {
                  const Icon = /\d:\d\d|AM|PM|week/i.test(l) && !/,/.test(l) ? Clock : i === 0 ? MapPin : Info;
                  return <li key={l} className="flex items-start gap-2.5"><Icon size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />{l}</li>;
                })}
              </ul>
              {panel.note && <p className="mt-2 text-sm text-muted-dark">{panel.note}</p>}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
