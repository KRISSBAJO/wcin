import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import { site } from '@/data/site';
import { getLeaders, getSettings } from '@/lib/content';
import { BookOpen, Church, Cross, ExternalLink, Flame, ShieldCheck, Sprout, type LucideIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About',
  description: `About ${site.name}: our story, the Liberation Mandate, what we believe, and our leadership.`,
};

const beliefs: { title: string; text: string; icon: LucideIcon }[] = [
  { title: 'The Bible', text: 'The Word of God is inspired, infallible and the final authority for faith and life.', icon: BookOpen },
  { title: 'Salvation', text: 'Salvation is by grace through faith in Jesus Christ, who died and rose again for all.', icon: Cross },
  { title: 'The Holy Spirit', text: 'The baptism of the Holy Spirit empowers believers for a life of purpose and exploits.', icon: Flame },
  { title: 'Faith', text: "Faith in God's Word, acted upon, is the key to victory in every area of life.", icon: ShieldCheck },
  { title: 'Prosperity', text: 'God desires His children to prosper in spirit, soul, body and finances, through covenant practice.', icon: Sprout },
  { title: 'The Church', text: "The local church is God's family on earth. Every member belongs, serves and grows.", icon: Church },
];
const links = [
  ['Living Faith Church Worldwide', 'https://faithtabernacle.org.ng/'],
  ['Word of Faith Bible Institute', 'https://wofbi.lfcww.org/'],
  ['Faith Tabernacle live stream', 'https://media.faithtabernacle.org.ng/'],
  ['Resources and prophetic focus', 'https://resources.faithtabernacle.org.ng/'],
];

export default async function AboutPage() {
  const [leaders, settings] = await Promise.all([getLeaders(), getSettings()]);
  return (
    <>
      <PageHero eyebrow="About us" title="Who we are" image={settings.photo_about_url || undefined} lead={`${site.name} is a branch of ${site.parent}, also known as Winners' Chapel International. We are a family of believers built on the word of faith.`} />

      <section className="section" id="mandate">
        <div className="wrap grid grid-cols-12 items-start gap-x-6 gap-y-10">
          <div className="col-span-12 flex flex-col gap-5 lg:col-span-5">
            <span className="eyebrow">The mandate</span>
            <h2 className="h-section">Liberating people through the word of faith</h2>
            {settings.photo_mandate_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.photo_mandate_url} alt="" className="mt-2 aspect-[4/3] w-full rounded-sm bg-paper-2 object-cover" loading="lazy" />
            )}
          </div>
          <div className="col-span-12 flex flex-col gap-6 lg:col-span-7">
            <blockquote className="border-l-4 border-accent pl-5 text-xl italic leading-[1.45] lg:text-2xl">“The hour has come to liberate the world from all oppressions of the devil through the preaching of the word of faith, and I am sending you to undertake this task.”</blockquote>
            <p className="body-copy">That commission came to {site.founder} in an 18-hour vision in May 1981. From a first church in Kaduna, Nigeria in 1983, Living Faith Church has grown to tens of thousands of churches across more than 150 nations, with its headquarters at Faith Tabernacle, Canaanland, Ota.</p>
            <p className="body-copy">The Nashville church began in October {site.plantedYear} to carry that same mandate to Middle Tennessee. We preach faith, teach the Word, pray together, and raise people who prosper in every area of life.</p>
          </div>
        </div>
      </section>

      <section className="section bg-paper-2" id="beliefs">
        <div className="wrap">
          <div className="mb-12 flex max-w-[720px] flex-col gap-3"><span className="eyebrow">What we believe</span><h2 className="h-section">Our core beliefs</h2></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {beliefs.map((b) => (
              <div key={b.title} className="flex flex-col gap-3 bg-white px-7 py-8"><b.icon size={28} className="mb-1 text-accent" aria-hidden="true" /><h3 className="text-[32px] leading-none">{b.title}</h3><p className="text-base leading-[1.55] text-body">{b.text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="leadership">
        <div className="wrap">
          <div className="mb-12 flex max-w-[720px] flex-col gap-3"><span className="eyebrow">Leadership</span><h2 className="h-section">The people who serve you</h2></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {leaders.map((l) => (
              <div key={l.id} className="flex flex-col gap-2.5">
                {l.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.photo_url} alt={l.name} className="mb-2 aspect-[4/5] w-full bg-paper-2 object-cover object-top" loading="lazy" />
                ) : (
                  <div className="placeholder-box mb-2 aspect-[4/5]">[Photo of {l.name}]</div>
                )}
                <span className="text-[13px] font-bold uppercase tracking-[0.16em] text-accent">{l.role}</span>
                <h3 className="text-[34px] leading-none">{l.name}</h3>
                <p className="text-base leading-[1.55] text-body">{l.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-ink text-white">
        <div className="wrap grid grid-cols-12 items-start gap-x-6 gap-y-10">
          <div className="col-span-12 flex flex-col gap-5 lg:col-span-7">
            <span className="eyebrow text-gold">Part of something bigger</span>
            <h2 className="h-section">One church, many nations</h2>
            <p className="text-lg leading-[1.6] text-muted-dark">Everything we do in Nashville flows from the same Word, the same prophetic focus and the same annual gatherings as Winners&apos; churches around the world. Shiloh, the annual convocation from Canaanland, is streamed live here every December.</p>
          </div>
          <div className="col-span-12 flex flex-col lg:col-span-5">
            {settings.photo_nations_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.photo_nations_url} alt="" className="mb-6 aspect-[16/10] w-full rounded-sm bg-ink-2 object-cover" loading="lazy" />
            )}
            {links.map(([label, href]) => (
              <a key={href} href={href} rel="noopener" target="_blank" className="flex items-center justify-between gap-4 border-b border-line-dark py-4 text-lg font-semibold text-white no-underline hover:text-gold">{label}<ExternalLink size={18} className="shrink-0 text-gold" aria-hidden="true" /></a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
