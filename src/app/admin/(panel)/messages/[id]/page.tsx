import { redirect } from 'next/navigation';
import { Save, Trash2 } from 'lucide-react';
import { one } from '@/lib/db';
import type { MessageRow } from '@/lib/content';
import { idParam } from '@/lib/admin';
import { todayCentral } from '@/lib/dates';
import { deleteMessage, updateMessage } from '../../../actions';
import { Back, Check, Field, Flash, Panel, actions, btnDanger, btnPrimary, fields, input, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Edit message' };

export default async function EditMessagePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const id = idParam((await params).id);
  if (!id) redirect('/admin/messages');
  const [sp, m] = await Promise.all([searchParams, one<MessageRow>('SELECT * FROM messages WHERE id = ?', [id])]);
  if (!m) redirect('/admin/messages');
  return (
    <>
      <PageHeader icon="messages" title="Edit message" />
      <Back href="/admin/messages" label="All messages" />
      <Flash ok={sp.ok} error={sp.error} />
      <Panel>
        <form action={updateMessage.bind(null, id)} className={fields}>
          <Field id="title" label="Title" wide><input id="title" name="title" required maxLength={200} defaultValue={m.title} className={input} /></Field>
          <Field id="speaker" label="Speaker"><input id="speaker" name="speaker" maxLength={120} defaultValue={m.speaker} className={input} /></Field>
          <Field id="preached_on" label="Date preached"><input id="preached_on" name="preached_on" type="date" required max={todayCentral()} defaultValue={m.preached_on} className={input} /></Field>
          <Field id="length" label="Length"><input id="length" name="length" maxLength={30} defaultValue={m.length} className={input} /></Field>
          <Field id="video_url" label="Video link"><input id="video_url" name="video_url" type="url" maxLength={500} defaultValue={m.video_url} className={input} /></Field>
          <Field id="description" label="Description (two sentences for the Watch page)" wide><textarea id="description" name="description" maxLength={300} defaultValue={m.description} className={`${input} min-h-[80px] resize-y`} /></Field>
          <Field id="points" label="Key points (one per line, optional)" wide><textarea id="points" name="points" maxLength={600} defaultValue={m.points} className={`${input} min-h-[80px] resize-y`} /></Field>
          <Check name="published" label="Show on the website" defaultChecked={Boolean(m.published)} />
          <div className={actions}><button className={btnPrimary}><Save size={16} aria-hidden="true" />Save</button></div>
        </form>
        <form action={deleteMessage.bind(null, id)}><button className={btnDanger}><Trash2 size={16} aria-hidden="true" />Delete this message</button></form>
      </Panel>
    </>
  );
}
