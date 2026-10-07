import { redirect } from 'next/navigation';
import { Save, Send, Trash2, UserCog } from 'lucide-react';
import { requireManager } from '@/lib/auth';
import { getUser, ROLES, initials } from '@/lib/users';
import { idParam } from '@/lib/admin';
import { stamp } from '@/lib/dates';
import { deleteUser, resendInvite, updateUser } from '../../../actions';
import { Back, Check, Field, Flash, Panel, Pill, actions, btnDanger, btnOutline, btnPrimary, fields, input, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Edit user' };

export default async function EditUserPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const me = await requireManager();
  const id = idParam((await params).id);
  if (!id) redirect('/admin/users');
  const [sp, u] = await Promise.all([searchParams, getUser(id)]);
  if (!u) redirect('/admin/users');
  const self = u.id === me.id;
  return (
    <>
      <PageHeader icon="leaders" title={u.name} description={u.email} />
      <Back href="/admin/users" label="All users" />
      <Flash ok={sp.ok} error={sp.error} />
      <Panel icon={UserCog} title="Account">
        <div className="flex flex-wrap items-center gap-4">
          <span className={`flex h-14 w-14 items-center justify-center rounded-full text-[16px] font-medium ${u.role === 'admin' ? 'bg-gold/80 text-ink' : 'bg-paper-2 text-[#5f5f66]'}`}>{initials(u.name)}</span>
          <div className="flex flex-col gap-1 text-[13.5px]">
            <span className="flex items-center gap-2">{!u.active ? <Pill>deactivated</Pill> : u.invite_pending ? <Pill kind="warn">invited, no password yet</Pill> : !u.has_password ? <Pill kind="warn">invite expired</Pill> : <Pill kind="ok">active</Pill>}{self && <span className="text-muted">This is you.</span>}</span>
            <span className="font-light text-muted">Last signed in: {u.last_login_at ? stamp(u.last_login_at) : 'never'} · Added {stamp(u.created_at)}</span>
          </div>
          {!u.has_password && (
            <form action={resendInvite.bind(null, id)} className="ml-auto"><button className={btnOutline}><Send size={16} aria-hidden="true" />Send the invite again</button></form>
          )}
        </div>
        <form action={updateUser.bind(null, id)} className={fields}>
          <Field id="name" label="Name"><input id="name" name="name" required maxLength={120} defaultValue={u.name} className={input} /></Field>
          <Field id="email" label="Email" hint="Email cannot be changed. Remove the account and invite the new address instead."><input id="email" type="email" value={u.email} disabled className={input} /></Field>
          <fieldset className="flex flex-col gap-2 sm:col-span-2">
            <legend className="text-[13px] font-medium text-ink">Role</legend>
            {ROLES.map((r) => (
              <label key={r.value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3.5 has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                <input type="radio" name="role" value={r.value} defaultChecked={u.role === r.value} className="mt-1 accent-accent" />
                <span className="flex flex-col"><span className="text-[14px] font-medium text-ink">{r.label}</span><span className="text-[12.5px] font-light text-muted">{r.note}</span></span>
              </label>
            ))}
          </fieldset>
          <Check name="active" label="Can sign in (untick to deactivate without deleting)" defaultChecked={Boolean(u.active)} />
          <div className={actions}><button className={btnPrimary}><Save size={16} aria-hidden="true" />Save</button></div>
        </form>
        {!self && <form action={deleteUser.bind(null, id)}><button className={btnDanger}><Trash2 size={16} aria-hidden="true" />Remove this account</button></form>}
      </Panel>
    </>
  );
}
