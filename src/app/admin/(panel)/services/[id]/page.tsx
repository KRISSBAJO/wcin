import { redirect } from 'next/navigation';
import { Save, Trash2 } from 'lucide-react';
import { one } from '@/lib/db';
import type { ServiceRow } from '@/lib/content';
import { idParam } from '@/lib/admin';
import { deleteService, updateService } from '../../../actions';
import { Back, Check, Field, Flash, Panel, actions, btnDanger, btnPrimary, fields, input, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Edit service' };
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Monday to Friday', 'Every day'];

export default async function EditServicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const id = idParam((await params).id);
  if (!id) redirect('/admin/services');
  const [sp, s] = await Promise.all([searchParams, one<ServiceRow>('SELECT * FROM services WHERE id = ?', [id])]);
  // Forms with a file input must post multipart; server actions handle that automatically.
  if (!s) redirect('/admin/services');
  const days = DAYS.includes(s.day) ? DAYS : [s.day, ...DAYS];
  return (
    <>
      <PageHeader icon="services" title="Edit service" />
      <Back href="/admin/services" label="All services" />
      <Flash ok={sp.ok} error={sp.error} />
      <Panel>
        {s.default_image && (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.default_image} alt="" className="h-28 w-28 rounded-lg bg-paper-2 object-cover ring-1 ring-line" />
            <span className="text-muted">Fallback flyer for {s.day}. Upload a new one below to replace it (all {s.day} services share it).</span>
          </div>
        )}
        <form action={updateService.bind(null, id)} className={fields}>
          <Field id="day" label="Day"><select id="day" name="day" required defaultValue={s.day} className={input}>{days.map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Field id="label" label="Name"><input id="label" name="label" maxLength={80} defaultValue={s.label} className={input} /></Field>
          <Field id="start_time" label="Starts"><input id="start_time" name="start_time" maxLength={20} defaultValue={s.start_time} required className={input} /></Field>
          <Field id="end_time" label="Ends (optional)"><input id="end_time" name="end_time" maxLength={20} defaultValue={s.end_time} className={input} /></Field>
          <Field id="note" label="Note"><input id="note" name="note" maxLength={120} defaultValue={s.note} className={input} /></Field>
          <Field id="sort" label="Order"><input id="sort" name="sort" type="number" defaultValue={s.sort} min={0} max={999} className={input} /></Field>
          <Field id="flyer" label="Replace fallback flyer (optional, square image)" wide><input id="flyer" name="flyer" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={input} /></Field>
          <Check name="active" label="Show on the website" defaultChecked={Boolean(s.active)} />
          <div className={actions}><button className={btnPrimary}><Save size={16} aria-hidden="true" />Save</button></div>
        </form>
        <form action={deleteService.bind(null, id)}><button className={btnDanger}><Trash2 size={16} aria-hidden="true" />Delete this service</button></form>
      </Panel>
    </>
  );
}
