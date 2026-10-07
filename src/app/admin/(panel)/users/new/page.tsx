import { Send, UserPlus } from 'lucide-react';
import { requireManager } from '@/lib/auth';
import { ROLES } from '@/lib/users';
import { mailConfigured } from '@/lib/notify';
import { addUser } from '../../../actions';
import { Back, CancelLink, Field, Flash, Panel, actions, btnPrimary, fields, input, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Invite someone' };

export default async function NewUserPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireManager();
  const sp = await searchParams;
  return (
    <>
      <PageHeader icon="leaders" title="Invite someone" description={mailConfigured() ? 'They get an email with a link to choose their own password. You never see or handle it.' : 'Email is not set up on the server yet, so after saving you will be given a link to pass on yourself.'} />
      <Back href="/admin/users" label="All users" />
      <Flash ok={sp.ok} error={sp.error} />
      <Panel icon={UserPlus} title="New staff account">
        <form action={addUser} className={fields}>
          <Field id="name" label="Name"><input id="name" name="name" required maxLength={120} placeholder="Deaconess Grace Okoro" className={input} /></Field>
          <Field id="email" label="Email" hint="They will sign in with this."><input id="email" name="email" type="email" required maxLength={200} className={input} /></Field>
          <fieldset className="flex flex-col gap-2 sm:col-span-2">
            <legend className="text-[13px] font-medium text-ink">Role</legend>
            {ROLES.map((r, i) => (
              <label key={r.value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3.5 has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                <input type="radio" name="role" value={r.value} defaultChecked={i === 1} className="mt-1 accent-accent" />
                <span className="flex flex-col"><span className="text-[14px] font-medium text-ink">{r.label}</span><span className="text-[12.5px] font-light text-muted">{r.note}</span></span>
              </label>
            ))}
          </fieldset>
          <div className={actions}>
            <button className={btnPrimary}><Send size={16} aria-hidden="true" />Send invite</button>
            <CancelLink href="/admin/users" />
          </div>
        </form>
      </Panel>
    </>
  );
}
