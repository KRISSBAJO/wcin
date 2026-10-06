import { redirect } from 'next/navigation';
import { Save, Scissors, Trash2 } from 'lucide-react';
import { one } from '@/lib/db';
import type { LeaderRow } from '@/lib/content';
import { idParam } from '@/lib/admin';
import { deleteLeader, makeCutout, updateLeader } from '../../../actions';
import { openaiConfigured } from '@/lib/openai';
import { Back, Check, Field, Flash, Panel, actions, btnDanger, btnOutline, btnPrimary, fields, input, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Edit leader' };

export default async function EditLeaderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const id = idParam((await params).id);
  if (!id) redirect('/admin/leaders');
  const [sp, l] = await Promise.all([searchParams, one<LeaderRow>('SELECT * FROM leaders WHERE id = ?', [id])]);
  if (!l) redirect('/admin/leaders');
  return (
    <>
      <PageHeader icon="leaders" title="Edit leader" />
      <Back href="/admin/leaders" label="All leaders" />
      <Flash ok={sp.ok} error={sp.error} />
      <Panel>
        <div className="flex flex-wrap gap-4">
          {l.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.photo_url} alt={l.name} className="aspect-[4/5] w-40 rounded-lg bg-paper-2 object-cover ring-1 ring-line" />
          )}
          {l.cutout_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.cutout_url} alt="" className="aspect-[4/5] w-40 rounded-lg bg-ink-2 object-contain ring-1 ring-line" />
          )}
          {l.photo_url && openaiConfigured() && (
            <form action={makeCutout.bind(null, id)} className="flex flex-col justify-end gap-2 text-sm text-muted">
              <span className="max-w-[260px]">{l.cutout_url ? 'The cut-out is what flyers paste onto the artwork. Remake it if the edges look wrong.' : 'No cut-out yet. Make one from the photo and flyers can place this leader on the artwork.'}</span>
              <button className={`${btnOutline} self-start`}><Scissors size={16} aria-hidden="true" />{l.cutout_url ? 'Remake cut-out with AI' : 'Make cut-out with AI'}</button>
              <span className="text-xs">Takes about 20 seconds.</span>
            </form>
          )}
        </div>
        <form action={updateLeader.bind(null, id)} className={fields}>
          <Field id="name" label="Name"><input id="name" name="name" required maxLength={120} defaultValue={l.name} className={input} /></Field>
          <Field id="role" label="Role"><input id="role" name="role" maxLength={80} defaultValue={l.role} className={input} /></Field>
          <Field id="bio" label="Short bio" wide><textarea id="bio" name="bio" maxLength={2000} defaultValue={l.bio} className={`${input} min-h-[140px] resize-y`} /></Field>
          <Field id="photo" label={l.photo_url ? 'Replace photo (optional)' : 'Photo (optional)'}><input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={input} /></Field>
          <Field id="cutout" label={l.cutout_url ? 'Replace flyer cut-out (optional)' : 'Flyer cut-out (optional)'} hint="Optional. When you upload a photo the app makes the cut-out itself; only upload one here if you prefer your own."><input id="cutout" name="cutout" type="file" accept="image/png,image/webp" className={input} /></Field>
          <Field id="sort" label="Order"><input id="sort" name="sort" type="number" defaultValue={l.sort} min={0} max={999} className={input} /></Field>
          <Check name="active" label="Show on the website" defaultChecked={Boolean(l.active)} />
          <div className={actions}><button className={btnPrimary}><Save size={16} aria-hidden="true" />Save</button></div>
        </form>
        <form action={deleteLeader.bind(null, id)}><button className={btnDanger}><Trash2 size={16} aria-hidden="true" />Remove this leader</button></form>
      </Panel>
    </>
  );
}
