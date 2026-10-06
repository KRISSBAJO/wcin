import type { Metadata } from 'next';
import FormSplit from '@/components/FormSplit';
import SiteForm, { Field } from '@/components/SiteForm';
import { site } from '@/data/site';
import { getServices, groupByDay } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Prayer Request',
  description: `Send a prayer request to ${site.name}. Our prayer team prays over every request.`,
};

export default async function PrayerPage() {
  const services = await getServices();
  const groups = groupByDay(services);
  const covenant = groups.find((g) => g.day !== 'Sunday' && /prayer/i.test(g.services[0]?.label ?? '')) ?? groups[0];
  return (
    <FormSplit
      eyebrow="Prayer request"
      title={<>How can we<br />pray for you?</>}
      intro="Nothing is too small or too big. Our prayer team prays over every request, and the pastors pray over them together each week."
      panel={{
        image: covenant?.image,
        eyebrow: 'Pray with us',
        title: covenant?.services[0]?.label ?? 'Covenant Hour of Prayer',
        lines: covenant ? covenant.services.map((s) => `${s.day} · ${s.time}`) : [],
        note: `In an emergency, call ${site.phone}. A pastor is on call.`,
      }}
    >
      <SiteForm
        name="prayer-request"
        submitLabel="Send my prayer request"
        note="Requests are confidential and seen only by the prayer team and pastors."
        success={{
          title: 'We are praying with you',
          text: 'Your request has reached the prayer team. If you left an email, a pastor will reply this week.',
          links: [{ href: '/visit', label: 'Join us this Sunday' }, { href: '/watch', label: 'Watch online' }],
        }}
      >
        <Field id="p-name" label="Hello, what's your name?" hint="You can leave this blank to stay anonymous.">
          <input id="p-name" name="name" type="text" autoComplete="name" className="field-input" />
        </Field>
        <Field id="p-request" label="What is your prayer request?">
          <textarea id="p-request" name="request" required className="field-input min-h-[180px] resize-y" placeholder="Share as much or as little as you like." />
        </Field>
        <Field id="p-email" label="Would you like a pastor to reply?" hint="Optional. Leave your email and we will write back.">
          <input id="p-email" name="email" type="email" autoComplete="email" className="field-input" placeholder="you@example.com" />
        </Field>
        <label className="flex items-start gap-3 text-[15px] leading-[1.5]">
          <input name="share" type="checkbox" className="mt-0.5 h-5 w-5 accent-accent" /> It is okay to share this request anonymously with the whole prayer team.
        </label>
      </SiteForm>
    </FormSplit>
  );
}
