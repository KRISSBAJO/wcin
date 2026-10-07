import { CalendarPlus, Plus } from 'lucide-react';
import { todayCentral } from '@/lib/dates';
import { addEvent } from '../../../actions';
import AiDraft from '@/components/admin/AiDraft';
import { textProvider } from '@/lib/llm';
import { Back, CancelLink, Check, Field, Flash, Panel, actions, btnPrimary, fields, input, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Add an event' };

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <PageHeader icon="events" title="Add an event" description="Describe it in your own words and let the AI draft the fields, or fill them in yourself." />
      <Back href="/admin/events" label="All events" />
      <Flash ok={sp.ok} error={sp.error} />
      <Panel icon={CalendarPlus} title="Event details">
        <AiDraft
          kind="event"
          enabled={Boolean(textProvider())}
          fill={{ title: 'title', detail: 'detail', starts_on: 'starts_on', ends_on: 'ends_on' }}
          show={{ announcement: 'Suggested announcement line' }}
          placeholder="Describe it in your own words, e.g. Shiloh viewing centre Dec 8 to 13, all sessions live from Canaanland, main sanctuary, everyone welcome"
        />
        <form action={addEvent} className={fields}>
          <Field id="title" label="Title" wide><input id="title" name="title" required maxLength={200} className={input} /></Field>
          <Field id="detail" label="Detail (day, time, place)" wide><input id="detail" name="detail" maxLength={500} placeholder="Sunday · 9:00 AM · Main sanctuary" className={input} /></Field>
          <Field id="starts_on" label="Start date"><input id="starts_on" name="starts_on" type="date" required min={todayCentral()} className={input} /></Field>
          <Field id="ends_on" label="End date (optional)"><input id="ends_on" name="ends_on" type="date" className={input} /></Field>
          <Field id="photo" label="Flyer or photo (optional)" hint="Square or portrait works best. Shown on the Events page and the homepage card." wide><input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={input} /></Field>
          <Check name="published" label="Show on the website" defaultChecked />
          <div className={actions}>
            <button className={btnPrimary}><Plus size={16} aria-hidden="true" />Add event</button>
            <CancelLink href="/admin/events" />
          </div>
        </form>
      </Panel>
    </>
  );
}
