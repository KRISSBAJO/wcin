import type { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import { site } from '@/data/site';
import { getMinistries } from '@/lib/content';
import Icon from '@/components/Icon';
import { HandHelping } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Ministries',
  description: `Ministries at ${site.name}: WOFBI, Winners Kids, Winners Youth, Christian Family, Home Cells and service units.`,
};

export default async function MinistriesPage() {
  const ministries = await getMinistries();
  return (
    <>
      <PageHero eyebrow="Ministries" title={<>A place for every<br />age and season</>} lead="Whatever stage of life you are in, there is a place to learn, belong and serve." />

      <section className="section">
        <div className="wrap flex flex-col gap-12 lg:gap-24">
          {ministries.map((m, i) => (
            <article key={m.id} id={m.slug} className="grid scroll-mt-6 grid-cols-12 items-center gap-x-6 gap-y-8">
              <div className={`col-span-12 lg:col-span-5 ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                {m.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo_url} alt={m.title} className="aspect-[4/3] w-full bg-paper-2 object-cover" loading="lazy" />
                ) : (
                  <div className={`placeholder-box aspect-[4/3] ${i % 2 === 1 ? 'placeholder-box-light' : ''}`}>[Photo: {m.title}]</div>
                )}
              </div>
              <div className="col-span-12 flex min-w-0 flex-col gap-4 lg:col-span-7">
                <span className="eyebrow">{m.tag}</span>
                <h2 className="text-[40px] lg:text-[60px]">{m.title}</h2>
                <p className="body-copy">{m.body || m.summary}</p>
                <Link href={`/contact?about=${m.slug}`} className="text-link">Ask about {m.title.split(' ')[0]} <Icon name="arrow" size={18} /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section bg-ink text-white">
        <div className="wrap flex max-w-[720px] flex-col gap-5">
          <span className="eyebrow text-gold">Serve</span>
          <h2 className="h-section">Every member serves. Where will you?</h2>
          <p className="text-lg leading-[1.6] text-muted-dark">Tell us your gifts and availability and we will match you with a service unit.</p>
          <Link href="/contact?about=serve" className="btn btn-primary sm:self-start"><HandHelping size={16} aria-hidden="true" />Join a service unit</Link>
        </div>
      </section>
    </>
  );
}
