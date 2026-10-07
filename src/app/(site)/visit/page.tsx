import type { Metadata } from 'next';
import FormSplit from '@/components/FormSplit';
import ServiceTimes from '@/components/ServiceTimes';
import SiteForm, { Choices, Field } from '@/components/SiteForm';
import Faq from '@/components/Faq';
import { site } from '@/data/site';
import { mapEmbedSrc } from '@/lib/map';
import { getServices, groupByDay } from '@/lib/content';
import { longDate, upcomingDates, weekday } from '@/lib/dates';
import { Baby, Car, ExternalLink, Handshake, Music, type LucideIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Plan a Visit',
  description: `Plan your first visit to ${site.name}: service times, directions, parking, kids' ministry and what to expect.`,
};

const steps: { n: string; title: string; text: string; icon: LucideIcon }[] = [
  { n: '01', title: 'Arrive and park', text: 'Free parking on site. Ushers in red will guide you. Accessible spaces are by the main entrance.', icon: Car },
  { n: '02', title: 'Check in your kids', text: 'Winners Kids runs during both services for ages 2 to 12. Check-in is in the lobby. Background-checked volunteers.', icon: Baby },
  { n: '03', title: 'Worship and the Word', text: 'Lively praise, prayer, and a faith-building message from the Bible. Dress however you are comfortable.', icon: Music },
  { n: '04', title: 'Say hello after', text: "Stop by the First Timers' desk for a welcome gift and to meet a pastor. No one will put you on the spot.", icon: Handshake },
];
const faqs = [
  { q: 'What should I wear?', a: 'Whatever you are comfortable in. You will see suits and you will see jeans.' },
  { q: 'Is there anything for my children?', a: 'Yes. Winners Kids runs in the Sunday service at 9:00 AM for ages 2 to 12, with trained, background-checked volunteers.' },
  { q: 'Will I be asked to give?', a: 'An offering is taken, but guests are never expected to give. Just enjoy the service.' },
  { q: 'How do I become a member?', a: "Join the Believers' Foundation Class, held monthly on a Saturday. Sign up at the First Timers' desk or online." },
];

export default async function VisitPage() {
  const services = await getServices();
  const groups = groupByDay(services);
  const sunday = groups.find((g) => g.day === 'Sunday');
  const wednesday = groups.find((g) => g.day === 'Wednesday');
  const [thisSunday, nextSunday] = upcomingDates(0, 2);
  const [thisWednesday] = upcomingDates(3, 1);
  const dateOptions = [
    { value: thisSunday, label: `This Sunday`, sub: longDate(thisSunday) },
    { value: nextSunday, label: `Next Sunday`, sub: longDate(nextSunday) },
    ...(wednesday ? [{ value: thisWednesday, label: `This ${weekday(thisWednesday)}`, sub: `${longDate(thisWednesday)} · ${wednesday.services[0].time}` }] : []),
    { value: 'not-sure', label: 'Not sure yet' },
  ];
  const serviceOptions = (sunday?.services ?? []).map((s) => ({ value: `Sunday ${s.time}`, label: s.time, sub: s.label }));

  return (
    <>
      <FormSplit
        eyebrow="Plan a visit"
        title={<>We&apos;ll save<br />you a seat</>}
        intro="Tell us a little about yourself and we will have someone ready to welcome you at the door. It takes under a minute."
        panel={{
          image: sunday?.image,
          eyebrow: 'Sunday services',
          title: sunday?.services.map((s) => s.time).join(' · ') ?? '',
          lines: [
            `${site.address.street}, ${site.address.city}, ${site.address.state}`,
            'Free parking · Winners Kids for ages 2 to 12',
            ...(wednesday ? [`Mid-week: ${wednesday.day} ${wednesday.services[0].time}`] : []),
          ],
          note: 'Doors open 30 minutes before each service.',
        }}
      >
        <SiteForm
          name="plan-a-visit"
          submitLabel="Plan my visit"
          note="We only use this to welcome you on the day. No mailing list unless you ask."
          success={{
            title: 'See you Sunday',
            text: "Your seat is saved. Look for the First Timers' desk in the lobby when you arrive, and we will take care of the rest.",
            links: [{ href: '#directions', label: 'Get directions' }, { href: '/watch', label: 'Watch a service first' }],
          }}
        >
          <Field id="v-name" label="Hello, what's your name?">
            <input id="v-name" name="name" type="text" autoComplete="name" required className="field-input" placeholder="First and last name" />
          </Field>
          <Choices name="date" label="When do you plan to worship with us?" options={dateOptions} defaultValue={thisSunday} />
          {serviceOptions.length > 1 && <Choices name="service" label="Which Sunday service suits you?" options={serviceOptions} defaultValue={serviceOptions[0].value} />}
          <Choices name="kids" label="Bringing any children?" hint="Winners Kids runs during the Sunday service at 9:00 AM." options={[{ value: 'None', label: 'No' }, { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3 or more', label: '3 or more' }]} defaultValue="None" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="v-email" label="Email" hint="So we can confirm and send directions.">
              <input id="v-email" name="email" type="email" autoComplete="email" required className="field-input" />
            </Field>
            <Field id="v-phone" label="Phone" hint="Optional.">
              <input id="v-phone" name="phone" type="tel" autoComplete="tel" className="field-input" />
            </Field>
          </div>
          <label className="flex items-start gap-3 text-[15px] leading-[1.5]">
            <input name="first_time" type="checkbox" defaultChecked className="mt-0.5 h-5 w-5 accent-accent" /> This will be my first visit to Winners Chapel.
          </label>
        </SiteForm>
      </FormSplit>

      <section className="section bg-paper-2">
        <div className="wrap">
          <div className="mb-12 flex max-w-[720px] flex-col gap-3"><span className="eyebrow">What to expect</span><h2 className="h-section">No pressure. Just come as you are.</h2></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="flex flex-col gap-3.5 bg-white px-7 py-8">
                <span className="flex items-center justify-between"><span className="font-display text-[44px] leading-none text-accent">{s.n}</span><s.icon size={28} className="text-accent" aria-hidden="true" /></span>
                <h3 className="text-[30px] leading-none">{s.title}</h3>
                <p className="text-base leading-[1.5] text-body">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap grid grid-cols-12 gap-x-6 gap-y-10">
          <div className="col-span-12 flex flex-col gap-5 lg:col-span-4">
            <span className="eyebrow">When we meet</span>
            <h2 className="h-section">Service times</h2>
            <p className="body-copy">Both Sunday services are the same. Pick whichever suits your family. Doors open 30 minutes before.</p>
          </div>
          <div className="col-span-12 lg:col-span-8"><ServiceTimes /></div>
        </div>
      </section>

      <section className="section bg-paper-2" id="directions">
        <div className="wrap grid grid-cols-12 items-start gap-x-6 gap-y-10">
          <div className="col-span-12 flex flex-col gap-5 lg:col-span-5">
            <span className="eyebrow">Directions</span>
            <h2 className="h-section">Where to find us</h2>
            <div className="body-copy flex flex-col gap-3">
              <strong>{site.address.street}, {site.address.city}, {site.address.state} {site.address.zip}</strong>
              <span>From I-24, I-40 or I-65 take [EXIT]. The church is [LANDMARK DIRECTIONS]. Free on-site parking with overflow next door.</span>
              <span>Phone <a href={site.phoneHref}>{site.phone}</a> · <a href={`mailto:${site.email}`}>{site.email}</a></span>
              <a href={site.mapLinkUrl} className="text-link" rel="noopener" target="_blank">Open in Google Maps <ExternalLink size={16} aria-hidden="true" /></a>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-7">
            {mapEmbedSrc() ? (
              <iframe src={mapEmbedSrc()!} title="Map to the church" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" className="aspect-[16/10] w-full border-0" />
            ) : (
              <div className="placeholder-box placeholder-box-light aspect-[16/10]">[Embedded map · Nashville location]</div>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap grid grid-cols-12 gap-x-6 gap-y-10">
          <div className="col-span-12 flex flex-col gap-5 lg:col-span-4"><span className="eyebrow">Questions</span><h2 className="h-section">Before you come</h2></div>
          <div className="col-span-12 lg:col-span-8"><Faq items={faqs} /></div>
        </div>
      </section>
    </>
  );
}
