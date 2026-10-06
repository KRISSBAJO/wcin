import { ListPlus, Plus } from 'lucide-react';
import { todayCentral } from '@/lib/dates';
import { addMessage } from '../../../actions';
import AiDraft from '@/components/admin/AiDraft';
import { textProvider } from '@/lib/llm';
import { Back, CancelLink, Check, Field, Flash, Panel, actions, btnPrimary, fields, input, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Add a message' };

export default async function NewMessagePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <PageHeader icon="messages" title="Add a message" description="Paste the notes or a YouTube link and let the AI draft the summary, or fill the fields in yourself." />
      <Back href="/admin/messages" label="All messages" />
      <Flash ok={sp.ok} error={sp.error} />
      <Panel icon={ListPlus} title="Message details">
        <AiDraft
          kind="message"
          enabled={Boolean(textProvider())}
          withUrl
          fill={{ title: 'title', description: 'description', points: 'points', video_url: 'video_url' }}
          placeholder="Paste the sermon notes or transcript here. With just a YouTube link, the app reads the video title and keeps the summary general."
        />
        <form action={addMessage} className={fields}>
          <Field id="title" label="Title" wide><input id="title" name="title" required maxLength={200} className={input} /></Field>
          <Field id="speaker" label="Speaker"><input id="speaker" name="speaker" maxLength={120} defaultValue="Resident Pastor" className={input} /></Field>
          <Field id="preached_on" label="Date preached"><input id="preached_on" name="preached_on" type="date" required max={todayCentral()} className={input} /></Field>
          <Field id="length" label="Length (e.g. 58 min)"><input id="length" name="length" maxLength={30} className={input} /></Field>
          <Field id="video_url" label="Video link (YouTube)"><input id="video_url" name="video_url" type="url" maxLength={500} placeholder="https://youtu.be/…" className={input} /></Field>
          <Field id="description" label="Description (two sentences for the Watch page)" wide><textarea id="description" name="description" maxLength={300} className={`${input} min-h-[80px] resize-y`} /></Field>
          <Field id="points" label="Key points (one per line, optional)" wide><textarea id="points" name="points" maxLength={600} className={`${input} min-h-[80px] resize-y`} /></Field>
          <Check name="published" label="Show on the website" defaultChecked />
          <div className={actions}>
            <button className={btnPrimary}><Plus size={16} aria-hidden="true" />Add message</button>
            <CancelLink href="/admin/messages" />
          </div>
        </form>
      </Panel>
    </>
  );
}
