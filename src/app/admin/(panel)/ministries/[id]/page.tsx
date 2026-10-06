import { redirect } from 'next/navigation';
import { Save, Trash2 } from 'lucide-react';
import { one } from '@/lib/db';
import type { MinistryRow } from '@/lib/content';
import { idParam } from '@/lib/admin';
import { deleteMinistry, updateMinistry } from '../../../actions';
import { Back, Check, Field, Flash, Panel, actions, btnDanger, btnPrimary, fields, input, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Edit ministry' };

export default async function EditMinistryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const id = idParam((await params).id);
  if (!id) redirect('/admin/ministries');
  const [sp, m] = await Promise.all([searchParams, one<MinistryRow>('SELECT * FROM ministries WHERE id = ?', [id])]);
  if (!m) redirect('/admin/ministries');
  return (
    <>
      <PageHeader icon="ministries" title="Edit ministry" />
      <Back href="/admin/ministries" label="All ministries" />
      <Flash ok={sp.ok} error={sp.error} />
      <Panel>
        {m.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.photo_url} alt={m.title} className="aspect-[4/3] w-64 rounded-lg bg-paper-2 object-cover ring-1 ring-line" />
        )}
        <form action={updateMinistry.bind(null, id)} className={fields}>
          <Field id="title" label="Name"><input id="title" name="title" required maxLength={80} defaultValue={m.title} className={input} /></Field>
          <Field id="tag" label="Tag"><input id="tag" name="tag" maxLength={30} defaultValue={m.tag} className={input} /></Field>
          <Field id="slug" label="Link name (used in the page address)"><input id="slug" name="slug" maxLength={40} defaultValue={m.slug} className={input} /></Field>
          <Field id="sort" label="Order"><input id="sort" name="sort" type="number" defaultValue={m.sort} min={0} max={999} className={input} /></Field>
          <Field id="summary" label="One-line summary" wide><input id="summary" name="summary" maxLength={200} defaultValue={m.summary} className={input} /></Field>
          <Field id="body" label="Full description" wide><textarea id="body" name="body" maxLength={2000} defaultValue={m.body} className={`${input} min-h-[140px] resize-y`} /></Field>
          <Field id="photo" label={m.photo_url ? 'Replace photo (optional)' : 'Photo (optional)'}><input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={input} /></Field>
          <Check name="dark" label="Dark card on the homepage" defaultChecked={Boolean(m.dark)} />
          <Check name="active" label="Show on the website" defaultChecked={Boolean(m.active)} />
          <div className={actions}><button className={btnPrimary}><Save size={16} aria-hidden="true" />Save</button></div>
        </form>
        <form action={deleteMinistry.bind(null, id)}><button className={btnDanger}><Trash2 size={16} aria-hidden="true" />Remove this ministry</button></form>
      </Panel>
    </>
  );
}
