import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import SiteForm, { Field } from '@/components/SiteForm';
import Icon from '@/components/Icon';
import { CalendarDays, Clock } from 'lucide-react';
import { site } from '@/data/site';
import { getMinistries, getServices } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Contact ${site.name}: phone, email, address and a contact form.`,
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ about?: string }> }) {
  const [{ about }, services, ministries] = await Promise.all([searchParams, getServices(), getMinistries()]);
  const topics = [
    { value: 'general', label: 'General question' },
    { value: 'visit', label: 'Planning a visit' },
    { value: 'membership', label: 'Becoming a member' },
    { value: 'serve', label: 'Joining a service unit' },
    ...ministries.map((m) => ({ value: m.slug, label: m.title })),
    { value: 'pastor', label: 'Speak to a pastor' },
    { value: 'other', label: 'Something else' },
  ];
  const preset = topics.some((t) => t.value === about) ? about : 'general';
  return (
    <>
      <PageHero eyebrow="Contact" title="Get in touch" lead="Questions, pastoral care, or just want to say hello. We read every message." />
      <section className="section">
        <div className="wrap grid grid-cols-12 items-start gap-x-6 gap-y-10">
          <div className="col-span-12 flex flex-col gap-5 lg:col-span-5">
            <address className="flex flex-col gap-5 text-[17px] not-italic leading-[1.5] text-body">
              <span className="flex min-h-11 gap-3.5"><Icon name="pin" size={22} className="mt-0.5 shrink-0 text-accent" /><span><strong className="text-ink">Visit</strong><br />{site.address.street}<br />{site.address.city}, {site.address.state} {site.address.zip}</span></span>
              <a className="flex min-h-11 gap-3.5 text-body no-underline" href={site.phoneHref}><Icon name="phone" size={22} className="mt-0.5 shrink-0 text-accent" /><span><strong className="text-ink">Call</strong><br />{site.phone}</span></a>
              <a className="flex min-h-11 gap-3.5 text-body no-underline" href={`mailto:${site.email}`}><Icon name="mail" size={22} className="mt-0.5 shrink-0 text-accent" /><span><strong className="text-ink">Email</strong><br />{site.email}</span></a>
            </address>
            <div className="flex flex-col gap-1.5 border-t border-line pt-5 text-base">
              <span className="eyebrow flex items-center gap-2"><Clock size={16} className="text-accent" aria-hidden="true" />Office hours</span>
              <span>Tuesday to Friday, 9:00 AM to 4:00 PM</span>
              <span className="text-muted">Closed Mondays. Pastoral emergencies: call the number above any time.</span>
            </div>
            <div className="flex flex-col gap-1.5 border-t border-line pt-5 text-base">
              <span className="eyebrow flex items-center gap-2"><CalendarDays size={16} className="text-accent" aria-hidden="true" />Services</span>
              {services.map((s) => <span key={s.id}>{s.day} {s.time} · {s.label}</span>)}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-7">
            <SiteForm name="contact" submitLabel="Send message" note="We reply within two working days." success={{ title: 'Message received', text: 'Thank you. Someone from the office will reply within two working days.', links: [{ href: '/visit', label: 'Plan a visit' }] }}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="c-name" label="Full name"><input id="c-name" name="name" type="text" autoComplete="name" required className="field-input" /></Field>
                <Field id="c-email" label="Email"><input id="c-email" name="email" type="email" autoComplete="email" required className="field-input" /></Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="c-phone" label="Phone (optional)"><input id="c-phone" name="phone" type="tel" autoComplete="tel" className="field-input" /></Field>
                <Field id="c-topic" label="What is this about?">
                  <select id="c-topic" name="topic" defaultValue={preset} className="field-input">{topics.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
                </Field>
              </div>
              <Field id="c-message" label="Message"><textarea id="c-message" name="message" required className="field-input min-h-[140px] resize-y" /></Field>
            </SiteForm>
          </div>
        </div>
      </section>
    </>
  );
}
