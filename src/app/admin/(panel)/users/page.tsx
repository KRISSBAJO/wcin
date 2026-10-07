import { UserCog } from 'lucide-react';
import { requireManager } from '@/lib/auth';
import { listUsers, initials } from '@/lib/users';
import { stamp } from '@/lib/dates';
import { listState, sortRows, textMatch } from '@/lib/list';
import { AddLink, Empty, Flash, ListPanel, Pill, Primary, RowActions, SearchSummary, td, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Users' };
const PATH = '/admin/users';

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireManager();
  const [sp, all] = await Promise.all([searchParams, listUsers()]);
  const state = listState(sp, 'name', 'asc', ['name', 'role', 'status', 'login']);
  const filtered = all.filter((u) => textMatch(state.q, u.name, u.email, u.role));
  const rank = (u: (typeof all)[number]) => (!u.active ? 3 : u.invite_pending ? 1 : !u.has_password ? 2 : 0);
  const users = sortRows(filtered, (u) => ({ name: u.name, role: u.role, status: rank(u), login: u.last_login_at })[state.sort as 'name'], state.dir);
  const status = (u: (typeof all)[number]) => {
    const r = rank(u);
    return r === 3 ? <Pill>deactivated</Pill> : r === 1 ? <Pill kind="warn">invited</Pill> : r === 2 ? <Pill kind="warn">invite expired</Pill> : <Pill kind="ok">active</Pill>;
  };
  return (
    <>
      <PageHeader icon="leaders" title="Users" description="Who can sign in to this admin. Admins can do everything; editors manage content and the inbox but not users or settings. Each person has their own password.">
        <AddLink href="/admin/users/new" label="Invite someone" />
      </PageHeader>
      <Flash ok={sp.ok} error={sp.error} />
      <ListPanel
        icon={UserCog}
        title="Staff accounts"
        count={all.length}
        list={{ path: PATH, state }}
        searchPlaceholder="Search people"
        head={[{ label: 'Person', key: 'name' }, { label: 'Role', key: 'role', width: '120px' }, { label: 'Status', key: 'status', width: '150px' }, { label: 'Last signed in', key: 'login', width: '200px' }, { label: 'Actions', align: 'right', srOnly: true, width: '72px' }]}
      >
        {users.length === 0 ? (
          <tr><td colSpan={5}><Empty icon={UserCog} title="No one matches" text={state.q ? `Nothing matches “${state.q}”.` : 'Invite the first person.'} action={{ href: state.q ? PATH : '/admin/users/new', label: state.q ? 'Show all' : 'Invite someone' }} /></td></tr>
        ) : users.map((u) => (
          <tr key={u.id}>
            <td className={td}>
              <span className="flex items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-medium ${u.role === 'admin' ? 'bg-gold/80 text-ink' : 'bg-paper-2 text-[#5f5f66]'}`}>{initials(u.name)}</span>
                <Primary href={`/admin/users/${u.id}`} title={<>{u.name}{u.id === me.id && <span className="ml-2 text-[11px] font-light text-muted">(you)</span>}</>} sub={u.email} />
              </span>
            </td>
            <td className={`${td} capitalize`}>{u.role}</td>
            <td className={td}>{status(u)}</td>
            <td className={`${td} whitespace-nowrap text-muted`}>{u.last_login_at ? stamp(u.last_login_at) : 'Never'}</td>
            <td className={td}><RowActions edit={`/admin/users/${u.id}`} /></td>
          </tr>
        ))}
      </ListPanel>
      <SearchSummary shown={users.length} total={all.length} path={PATH} state={state} />
    </>
  );
}
