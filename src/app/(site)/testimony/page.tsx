import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import SiteForm, { Field } from '@/components/SiteForm';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: 'Share a Testimony',
  description: `Share what God has done in your life with ${site.name}.`,
};

export default function TestimonyPage() {
  return (
    <>
      <PageHero eyebrow="Testimony" title={<>Tell us what<br />God has done</>} lead="Your story builds someone else's faith. Testimonies may be read in service or shared online, with your permission." />
      <section className="section">
        <div className="wrap grid grid-cols-12 items-start gap-x-6 gap-y-10">
          <div className="col-span-12 lg:col-span-7">
            <SiteForm name="testimony" submitLabel="Share testimony" dark note="We will contact you before sharing your testimony publicly." success={{ title: 'Praise God', text: 'Thank you for sharing. We will be in touch before anything is read in service or posted online.', links: [{ href: '/watch', label: 'Watch recent messages' }] }}>
              <h2 className="text-[40px] leading-none">Your testimony</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="t-name" label="Full name" dark><input id="t-name" name="name" type="text" autoComplete="name" required className="field-input" /></Field>
                <Field id="t-email" label="Email" dark><input id="t-email" name="email" type="email" autoComplete="email" required className="field-input" /></Field>
              </div>
              <Field id="t-phone" label="Phone (optional)" dark><input id="t-phone" name="phone" type="tel" autoComplete="tel" className="field-input" /></Field>
              <Field id="t-title" label="Give it a title" dark><input id="t-title" name="title" type="text" placeholder="Healed after years of back pain" className="field-input" /></Field>
              <Field id="t-body" label="What happened?" dark><textarea id="t-body" name="testimony" required className="field-input min-h-[160px] resize-y" /></Field>
              <label className="flex items-start gap-3 text-[15px] leading-[1.5]"><input name="permission" type="checkbox" className="mt-0.5 h-5 w-5 accent-accent" /> You may share this testimony in service and online using my first name.</label>
            </SiteForm>
          </div>
          <div className="col-span-12 flex flex-col gap-5 lg:col-span-5">
            <span className="eyebrow">Why share</span>
            <h2 className="h-section">“They overcame by the word of their testimony”</h2>
            <p className="body-copy">Revelation 12:11. Every testimony shared in Winners&apos; churches around the world started with someone writing it down. Yours could be next.</p>
          </div>
        </div>
      </section>
    </>
  );
}
