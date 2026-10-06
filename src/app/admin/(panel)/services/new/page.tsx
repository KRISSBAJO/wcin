import { CalendarPlus, Plus } from 'lucide-react';
import { getAllServices } from '@/lib/content';
import { addService } from '../../../actions';
import { Back, CancelLink, Check, Field, Flash, Panel, actions, btnPrimary, fields, input, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Add a service' };
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Monday to Friday', 'Every day'];

export default async function NewServicePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [sp, services] = await Promise.all([searchParams, getAllServices()]);
  return (
    <>
      <PageHeader icon="services" title="Add a service" description="A regular service time. It appears on the homepage, the footer and the Plan a Visit page as soon as it is saved." />
      <Back href="/admin/services" label="All services" />
      <Flash ok={sp.ok} error={sp.error} />
      <Panel icon={CalendarPlus} title="Service details">
        <form action={addService} className={fields}>
          <Field id="day" label="Day"><select id="day" name="day" required className={input}>{DAYS.map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Field id="label" label="Name"><input id="label" name="label" maxLength={80} placeholder="Covenant Hour of Prayer" className={input} /></Field>
          <Field id="start_time" label="Starts" hint="Like 9:00 AM or 6:30 PM"><input id="start_time" name="start_time" maxLength={20} placeholder="5:00 AM" required className={input} /></Field>
          <Field id="end_time" label="Ends (optional)"><input id="end_time" name="end_time" maxLength={20} placeholder="6:00 AM" className={input} /></Field>
          <Field id="note" label="Note (optional)"><input id="note" name="note" maxLength={120} placeholder="Daily, also online" className={input} /></Field>
          <Field id="sort" label="Order (lower shows first)"><input id="sort" name="sort" type="number" defaultValue={services.length} min={0} max={999} className={input} /></Field>
          <Field id="flyer" label="Fallback flyer for this day (optional, square image)" hint="Shown on the homepage whenever no special flyer is live for this day." wide><input id="flyer" name="flyer" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={input} /></Field>
          <Check name="active" label="Show on the website" defaultChecked />
          <div className={actions}>
            <button className={btnPrimary}><Plus size={16} aria-hidden="true" />Add service</button>
            <CancelLink href="/admin/services" />
          </div>
        </form>
      </Panel>
    </>
  );
}
