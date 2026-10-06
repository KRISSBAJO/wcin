import { ExternalLink, PlaySquare } from 'lucide-react';
import { getAllMessages } from '@/lib/content';
import { longDate } from '@/lib/dates';
import { listState, sortRows, textMatch } from '@/lib/list';
import { AddLink, Empty, Flash, IconLink, ListPanel, Pill, Primary, RowActions, SearchSummary, td, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Messages' };
const PATH = '/admin/messages';

export default async function MessagesAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [sp, all] = await Promise.all([searchParams, getAllMessages()]);
  const state = listState(sp, 'preached', 'desc', ['preached', 'message', 'speaker', 'status']);
  const filtered = all.filter((m) => textMatch(state.q, m.title, m.speaker, m.description, m.preached_on));
  const messages = sortRows(filtered, (m) => ({ preached: m.preached_on, message: m.title, speaker: m.speaker, status: m.published ? 0 : 1 })[state.sort as 'preached'], state.dir);
  return (
    <>
      <PageHeader icon="messages" title="Messages" description="Sermons with their YouTube links. Published messages appear on the Watch page and the homepage.">
        <AddLink href="/admin/messages/new" label="Add a message" />
      </PageHeader>
      <Flash ok={sp.ok} error={sp.error} />
      <ListPanel
        icon={PlaySquare}
        title="All messages"
        count={all.length}
        list={{ path: PATH, state }}
        searchPlaceholder="Search messages"
        head={[{ label: 'Preached', key: 'preached', width: '160px' }, { label: 'Message', key: 'message' }, { label: 'Speaker', key: 'speaker', width: '200px' }, { label: 'Status', key: 'status', width: '110px' }, { label: 'Actions', align: 'right', srOnly: true, width: '110px' }]}
      >
        {messages.length === 0 ? (
          <tr><td colSpan={5}>{state.q ? <Empty icon={PlaySquare} title="No messages match" text={`Nothing matches “${state.q}”.`} action={{ href: PATH, label: 'Show all' }} /> : <Empty icon={PlaySquare} title="No messages yet" text="Add a sermon with its YouTube link and it appears on the Watch page and the homepage." action={{ href: '/admin/messages/new', label: 'Add a message' }} />}</td></tr>
        ) : messages.map((m) => (
          <tr key={m.id}>
            <td className={`${td} whitespace-nowrap font-medium`}>{longDate(m.preached_on)}</td>
            <td className={`${td} max-w-[480px]`}><Primary href={`/admin/messages/${m.id}`} title={m.title} sub={m.description || (m.length ? m.length : undefined)} /></td>
            <td className={`${td} text-muted`}>{m.speaker}</td>
            <td className={td}>{m.published ? <Pill kind="ok">live</Pill> : <Pill>hidden</Pill>}</td>
            <td className={td}>
              <RowActions edit={`/admin/messages/${m.id}`}>
                {m.video_url && <IconLink href={m.video_url} label="Open video" icon={ExternalLink} external />}
              </RowActions>
            </td>
          </tr>
        ))}
      </ListPanel>
      <SearchSummary shown={messages.length} total={all.length} path={PATH} state={state} />
    </>
  );
}
