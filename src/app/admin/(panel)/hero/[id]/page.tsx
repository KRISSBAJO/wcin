import { redirect } from 'next/navigation';
import { Download, Save, Trash2 } from 'lucide-react';
import { one } from '@/lib/db';
import { getServices, groupByDay, type SlideRow } from '@/lib/content';
import { stamp } from '@/lib/dates';
import { idParam } from '@/lib/admin';
import { deleteSlide, updateSlide } from '../../../actions';
import { downloadHref } from '@/lib/media';
import { Back, Check, Field, Flash, Panel, actions, btnDanger, btnOutline, btnPrimary, fields, input, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Edit flyer' };

export default async function EditSlidePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const id = idParam((await params).id);
  if (!id) redirect('/admin/hero');
  const [sp, s, services] = await Promise.all([searchParams, one<SlideRow>('SELECT * FROM hero_slides WHERE id = ?', [id]), getServices(true)]);
  if (!s) redirect('/admin/hero');
  const groups = groupByDay(services);
  const days = groups.some((g) => g.day === s.service_day) ? groups.map((g) => g.day) : [s.service_day, ...groups.map((g) => g.day)].filter(Boolean);
  return (
    <>
      <PageHeader icon="hero" title="Edit flyer" />
      <Back href="/admin/hero" label="All flyers" />
      <Flash ok={sp.ok} error={sp.error} />
      <Panel>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="flex flex-col items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.image_url} alt={s.headline} className="h-60 w-60 rounded-lg bg-paper-2 object-cover ring-1 ring-line" />
          <a href={downloadHref(s.image_url, s.headline || `${s.service_day} flyer`)} download className={btnOutline}><Download size={16} aria-hidden="true" />Download image</a>
        </div>
        {s.expires_at && <p className="text-sm text-muted">Shows until {stamp(s.expires_at)} Central. Change the date below to move it.</p>}
        <form action={updateSlide.bind(null, id)} className={fields}>
          <Field id="image" label="Replace image (optional)" wide><input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={input} /></Field>
          <Field id="service_day" label="Which service does it replace?">
            <select id="service_day" name="service_day" required defaultValue={s.service_day} className={input}>
              {days.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field id="service_date" label="Service date" hint="The date printed on the flyer and in the announcement bar."><input id="service_date" name="service_date" type="date" required defaultValue={s.service_date} className={input} /></Field>
          <Field id="show_until" label="Keep showing until (optional)" hint="Normally the flyer leaves the homepage 12 hours after the service. Set a date to keep it up longer; it leaves at the start of that day."><input id="show_until" name="show_until" type="date" defaultValue={s.show_until || ''} className={input} /></Field>
          <Field id="end_date" label="Last day of the programme (only if it runs several days)" hint="For example the Week of Spiritual Emphasis, Wednesday to Friday. The flyer then shows a date range. Leave empty for a single service." wide><input id="end_date" name="end_date" type="date" defaultValue={s.end_date || ''} className={`${input} sm:max-w-[320px]`} /></Field>
          <Field id="headline" label="Caption" wide><input id="headline" name="headline" maxLength={160} defaultValue={s.headline} className={input} /></Field>
          <Field id="link_url" label="Link when clicked" wide><input id="link_url" name="link_url" maxLength={500} defaultValue={s.link_url} className={input} /></Field>
          <Check name="active" label="Active" defaultChecked={Boolean(s.active)} />
          <Check name="replace_live" label="Replace the live flyer for that day, if there is another one (it is switched off, not deleted)" />
          <div className={actions}><button className={btnPrimary}><Save size={16} aria-hidden="true" />Save</button></div>
        </form>
        <form action={deleteSlide.bind(null, id)}><button className={btnDanger}><Trash2 size={16} aria-hidden="true" />Delete this flyer and its image</button></form>
      </Panel>
    </>
  );
}
