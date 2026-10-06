import { redirect } from 'next/navigation';
import { Save, Trash2 } from 'lucide-react';
import { one } from '@/lib/db';
import type { EventRow } from '@/lib/content';
import { idParam } from '@/lib/admin';
import { deleteEvent, updateEvent } from '../../../actions';
import { Back, Check, Field, Flash, Panel, Thumb, actions, btnDanger, btnPrimary, fields, input, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Edit event' };

export default async function EditEventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const id = idParam((await params).id);
  if (!id) redirect('/admin/events');
  const [sp, e] = await Promise.all([searchParams, one<EventRow>('SELECT * FROM events WHERE id = ?', [id])]);
  if (!e) redirect('/admin/events');
  return (
    <>
      <PageHeader icon="events" title="Edit event" />
      <Back href="/admin/events" label="All events" />
      <Flash ok={sp.ok} error={sp.error} />
      <Panel>
        {e.image_url && <Thumb src={e.image_url} className="h-40 w-40" />}
        <form action={updateEvent.bind(null, id)} className={fields}>
          <Field id="title" label="Title" wide><input id="title" name="title" required maxLength={200} defaultValue={e.title} className={input} /></Field>
          <Field id="detail" label="Detail" wide><input id="detail" name="detail" maxLength={500} defaultValue={e.detail} className={input} /></Field>
          <Field id="starts_on" label="Start date"><input id="starts_on" name="starts_on" type="date" required defaultValue={e.starts_on} className={input} /></Field>
          <Field id="ends_on" label="End date (optional)"><input id="ends_on" name="ends_on" type="date" defaultValue={e.ends_on ?? ''} className={input} /></Field>
          <Field id="photo" label={e.image_url ? 'Replace flyer or photo (optional)' : 'Flyer or photo (optional)'} hint="Square or portrait works best. Shown on the Events page and the homepage card." wide><input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={input} /></Field>
          {e.image_url && <Check name="remove_image" label="Remove the current image" />}
          <Check name="published" label="Show on the website" defaultChecked={Boolean(e.published)} />
          <div className={actions}><button className={btnPrimary}><Save size={16} aria-hidden="true" />Save</button></div>
        </form>
        <form action={deleteEvent.bind(null, id)}><button className={btnDanger}><Trash2 size={16} aria-hidden="true" />Delete this event</button></form>
      </Panel>
    </>
  );
}
