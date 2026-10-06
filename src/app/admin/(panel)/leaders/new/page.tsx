import { Plus, UserPlus } from 'lucide-react';
import { getAllLeaders } from '@/lib/content';
import { addLeader } from '../../../actions';
import { Back, CancelLink, Check, Field, Flash, Panel, actions, btnPrimary, fields, input, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Add a leader' };

export default async function NewLeaderPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [sp, leaders] = await Promise.all([searchParams, getAllLeaders()]);
  return (
    <>
      <PageHeader icon="leaders" title="Add a leader" description="Photos look best as portraits, 800 × 1000 pixels or larger. The app makes the flyer cut-out from the photo on its own." />
      <Back href="/admin/leaders" label="All leaders" />
      <Flash ok={sp.ok} error={sp.error} />
      <Panel icon={UserPlus} title="Leader details">
        <form action={addLeader} className={fields}>
          <Field id="name" label="Name"><input id="name" name="name" required maxLength={120} placeholder="Pastor Jane Doe" className={input} /></Field>
          <Field id="role" label="Role"><input id="role" name="role" maxLength={80} placeholder="Associate Pastor" className={input} /></Field>
          <Field id="bio" label="Short bio" wide><textarea id="bio" name="bio" maxLength={2000} className={`${input} min-h-[120px] resize-y`} /></Field>
          <Field id="photo" label="Photo (optional)" hint="Saving with a photo takes about 20 seconds longer while the cut-out is made."><input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={input} /></Field>
          <Field id="cutout" label="Flyer cut-out (optional)" hint="Only upload one if you prefer your own: a PNG with the background removed."><input id="cutout" name="cutout" type="file" accept="image/png,image/webp" className={input} /></Field>
          <Field id="sort" label="Order (lower shows first)"><input id="sort" name="sort" type="number" defaultValue={leaders.length} min={0} max={999} className={input} /></Field>
          <Check name="active" label="Show on the website" defaultChecked />
          <div className={actions}>
            <button className={btnPrimary}><Plus size={16} aria-hidden="true" />Add leader</button>
            <CancelLink href="/admin/leaders" />
          </div>
        </form>
      </Panel>
    </>
  );
}
