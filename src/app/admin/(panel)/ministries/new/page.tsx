import { Plus, Sparkles } from 'lucide-react';
import { getAllMinistries } from '@/lib/content';
import { addMinistry } from '../../../actions';
import { Back, CancelLink, Check, Field, Flash, Panel, actions, btnPrimary, fields, input, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Add a ministry' };

export default async function NewMinistryPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [sp, ministries] = await Promise.all([searchParams, getAllMinistries()]);
  return (
    <>
      <PageHeader icon="ministries" title="Add a ministry" description="A card on the homepage and a full section on the Ministries page." />
      <Back href="/admin/ministries" label="All ministries" />
      <Flash ok={sp.ok} error={sp.error} />
      <Panel icon={Sparkles} title="Ministry details">
        <form action={addMinistry} className={fields}>
          <Field id="title" label="Name"><input id="title" name="title" required maxLength={80} placeholder="Winners Kids" className={input} /></Field>
          <Field id="tag" label="Tag (small label on the card)"><input id="tag" name="tag" maxLength={30} placeholder="Kids" className={input} /></Field>
          <Field id="summary" label="One-line summary (homepage card)" wide><input id="summary" name="summary" maxLength={200} className={input} /></Field>
          <Field id="body" label="Full description (Ministries page)" wide><textarea id="body" name="body" maxLength={2000} className={`${input} min-h-[120px] resize-y`} /></Field>
          <Field id="photo" label="Photo (optional)" hint="Landscape, 1200 × 900 pixels or larger."><input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={input} /></Field>
          <Field id="sort" label="Order (lower shows first)"><input id="sort" name="sort" type="number" defaultValue={ministries.length} min={0} max={999} className={input} /></Field>
          <Check name="dark" label="Dark card on the homepage (use for one featured ministry)" />
          <Check name="active" label="Show on the website" defaultChecked />
          <div className={actions}>
            <button className={btnPrimary}><Plus size={16} aria-hidden="true" />Add ministry</button>
            <CancelLink href="/admin/ministries" />
          </div>
        </form>
      </Panel>
    </>
  );
}
