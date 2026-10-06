import type { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import Faq from '@/components/Faq';
import { site } from '@/data/site';
import { Building2, CreditCard, Globe, HandCoins, HandHeart, HeartHandshake, Percent, Smartphone, Star, type LucideIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Give',
  description: `Give online to ${site.name}: tithes, offerings, building project and missions. Secure and quick.`,
};

const types: [string, string, LucideIcon][] = [
  ['Tithe', 'A tenth of your increase, brought to the storehouse. Monthly or weekly.', Percent],
  ['Offering', "General, thanksgiving and prophet's offerings.", HandHeart],
  ['Building project', 'Towards the Nashville sanctuary fund.', Building2],
  ['Missions', 'Mission adoption scheme and rural church building.', Globe],
  ['Shiloh sacrifice', 'The annual Shiloh seed, every December.', Star],
  ['Welfare', 'Support for members and neighbours in need.', HeartHandshake],
];

export default function GivePage() {
  return (
    <>
      <PageHero eyebrow="Giving" title={<>Partner with the<br />work in Nashville</>} lead="Tithes, offerings and project giving are secure and take under a minute. Thank you for sowing into what God is doing here.">
        <div className="flex flex-col gap-3.5 bg-white p-7 text-ink">
          <span className="eyebrow">Fastest way</span>
          <span className="font-display text-[40px] leading-none">Give online now</span>
          <a href={site.giving.online} className="btn btn-primary" rel="noopener" target="_blank"><HandHeart size={16} aria-hidden="true" />Give online</a>
          <span className="text-sm text-muted">Card, bank transfer or wallet. Opens the secure giving page.</span>
        </div>
      </PageHero>

      <section className="section">
        <div className="wrap grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-4 bg-paper-2 px-8 py-9">
            <CreditCard size={28} className="text-accent" aria-hidden="true" />
            <span className="eyebrow">Online</span>
            <h2 className="text-[40px] leading-none">Card or bank</h2>
            <p className="body-copy">Give once or set up a recurring gift. Every gift is receipted by email for your records.</p>
            <a href={site.giving.online} className="btn btn-dark mt-auto sm:self-start" rel="noopener" target="_blank"><CreditCard size={16} aria-hidden="true" />Give online</a>
          </div>
          <div className="flex flex-col gap-4 bg-paper-2 px-8 py-9" id="text">
            <Smartphone size={28} className="text-accent" aria-hidden="true" />
            <span className="eyebrow">Text to give</span>
            <h2 className="text-[40px] leading-none">From your phone</h2>
            <p className="body-copy">Text <strong>{site.giving.textKeyword}</strong> and the amount to <strong>{site.giving.textNumber}</strong>. First time? You&apos;ll get a link to set up in 30 seconds.</p>
            <span className="text-[15px] text-muted">Example: <code className="bg-white px-1.5 py-0.5 font-mono">GIVE 100</code></span>
          </div>
          <div className="flex flex-col gap-4 bg-paper-2 px-8 py-9">
            <HandCoins size={28} className="text-accent" aria-hidden="true" />
            <span className="eyebrow">In person</span>
            <h2 className="text-[40px] leading-none">On Sunday</h2>
            <p className="body-copy">Giving envelopes are available from the ushers. Cheques payable to “{site.name}”.</p>
            <Link href="/visit" className="text-link mt-auto">Plan a visit →</Link>
          </div>
        </div>
      </section>

      <section className="section bg-paper-2">
        <div className="wrap">
          <div className="mb-10 flex flex-col gap-3"><span className="eyebrow">Where it goes</span><h2 className="h-section">Giving options</h2></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {types.map(([t, d, I]) => (
              <div key={t} className="flex flex-col gap-2.5 bg-white p-7"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-2 text-accent"><I size={22} aria-hidden="true" /></span><h3 className="text-[30px] leading-none">{t}</h3><p className="text-base leading-[1.5] text-body">{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap flex max-w-[860px] flex-col gap-5">
          <h2 className="h-section">Questions about giving</h2>
          <Faq items={[
            { q: 'Is online giving secure?', a: 'Yes. Payments are handled by the processor on an encrypted page. The church never sees or stores your card number.' },
            { q: 'Will I get a statement for tax?', a: 'Yes. Annual giving statements are sent each January to the email on your giving profile. Ask the office if you need one sooner.' },
            { q: 'I had a problem with a gift.', a: <>Email <a href={`mailto:${site.email}`}>{site.email}</a> with the date and amount and we will sort it out.</> },
          ]} />
        </div>
      </section>
    </>
  );
}
