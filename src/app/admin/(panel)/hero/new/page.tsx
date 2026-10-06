import { ImagePlus, Upload } from 'lucide-react';
import { getAllLeaders, getServices, groupByDay } from '@/lib/content';
import { todayCentral } from '@/lib/dates';
import { storageDescription } from '@/lib/storage';
import { openaiConfigured } from '@/lib/openai';
import { addSlide } from '../../../actions';
import FlyerGenerator from '@/components/admin/FlyerGenerator';
import { Back, CancelLink, Check, Field, Flash, Panel, actions, btnPrimary, fields, input, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Add a special flyer' };

type Keep = { ok?: string; error?: string; service_day?: string; service_date?: string; end_date?: string; show_until?: string; headline?: string; link_url?: string; generated_key?: string; generated_url?: string };

export default async function NewSlidePage({ searchParams }: { searchParams: Promise<Keep> }) {
  const [sp, services, leaders] = await Promise.all([searchParams, getServices(true), getAllLeaders()]);
  // Anyone with a picture can go on a flyer, even leaders hidden from the About page (for example the presiding bishop).
  const cutoutLeaders = leaders.filter((l) => l.cutout_key || l.photo_key).map((l) => ({ id: l.id, name: l.name, role: l.role, cutout: Boolean(l.cutout_key), photo: Boolean(l.photo_key) }));
  const groups = groupByDay(services);
  return (
    <>
      <PageHeader icon="hero" title="Add a special flyer" description={`Upload a square flyer (1000 × 1000 pixels or larger, under 1 MB) or generate one with AI. Storage: ${storageDescription()}.`} />
      <Back href="/admin/hero" label="All flyers" />
      <Flash ok={sp.ok} error={sp.error} />
      <Panel icon={ImagePlus} title="Flyer details">
        <form action={addSlide} className={fields}>
          <Field id="image" label="Image" hint="Upload a square flyer, or generate one below." wide><input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required className={input} /></Field>
          <input type="hidden" id="generated_key" name="generated_key" defaultValue={sp.generated_key ?? ''} />
          <input type="hidden" id="generated_url" name="generated_url" defaultValue={sp.generated_url ?? ''} />
          <div className="flex flex-col gap-3 sm:col-span-2">
            <FlyerGenerator enabled={openaiConfigured()} serviceId="service_day" dateId="service_date" keyId="generated_key" urlId="generated_url" fileId="image" leaders={cutoutLeaders} days={groups.map((g) => ({ value: g.day, label: `${g.day} · ${g.services.map((s) => s.time).join(' and ')}` }))} minDate={todayCentral()} endId="end_date" initial={sp.generated_key?.startsWith('hero/drafts/') && sp.generated_url ? { key: sp.generated_key, url: sp.generated_url } : undefined} />
          </div>
          <Field id="service_day" label="Which service does it replace?">
            <select id="service_day" name="service_day" required defaultValue={sp.service_day} className={input}>
              {groups.map((g) => <option key={g.day} value={g.day}>{g.day} · {g.services.map((s) => s.time).join(' and ')}</option>)}
            </select>
          </Field>
          <Field id="service_date" label="Service date" hint="The date printed on the flyer and in the announcement bar."><input id="service_date" name="service_date" type="date" required min={todayCentral()} defaultValue={sp.service_date ?? ''} className={input} /></Field>
          <Field id="show_until" label="Keep showing until (optional)" hint="Normally the flyer leaves the homepage 12 hours after the service. Set a date to keep it up longer; it leaves at the start of that day."><input id="show_until" name="show_until" type="date" min={todayCentral()} defaultValue={sp.show_until ?? ''} className={input} /></Field>
          <Field id="end_date" label="Last day of the programme (only if it runs several days)" hint="For example the Week of Spiritual Emphasis, Wednesday to Friday. The flyer then shows a date range. Leave empty for a single service." wide><input id="end_date" name="end_date" type="date" min={todayCentral()} defaultValue={sp.end_date ?? ''} className={`${input} sm:max-w-[320px]`} /></Field>
          <Field id="headline" label="Caption (used as the image description)" wide><input id="headline" name="headline" maxLength={160} placeholder="Showers of Blessings · Sunday Oct 12" defaultValue={sp.headline ?? ''} className={input} /></Field>
          <Field id="link_url" label="Link when clicked (optional)" wide><input id="link_url" name="link_url" maxLength={500} placeholder="/events or https://…" defaultValue={sp.link_url ?? ''} className={input} /></Field>
          <Check name="active" label="Active" defaultChecked />
          <Check name="replace_live" label="Replace the live flyer for that day, if there is one (it is kept in the list, switched off)" defaultChecked={Boolean(sp.error && /already a live/.test(sp.error))} />
          <div className={actions}>
            <button className={btnPrimary}><Upload size={16} aria-hidden="true" />Upload and add</button>
            <CancelLink href="/admin/hero" />
          </div>
        </form>
      </Panel>
    </>
  );
}
