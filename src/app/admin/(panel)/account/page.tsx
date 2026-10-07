import { KeyRound, Save, UserRound } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { MIN_PASSWORD, initials } from '@/lib/users';
import { stamp } from '@/lib/dates';
import { updateAccount } from '../../actions';
import { Field, Flash, Panel, Pill, actions, btnPrimary, fields, input, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Your account' };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [sp, me] = await Promise.all([searchParams, requireAdmin()]);
  return (
    <>
      <PageHeader icon="leaders" title="Your account" description="Your name as it appears in the admin, and your password." />
      <Flash ok={sp.ok} error={sp.error} />
      <Panel icon={UserRound} title="Profile">
        <div className="flex flex-wrap items-center gap-4">
          <span className={`flex h-14 w-14 items-center justify-center rounded-full text-[16px] font-medium ${me.role === 'admin' ? 'bg-gold/80 text-ink' : 'bg-paper-2 text-[#5f5f66]'}`}>{initials(me.name)}</span>
          <div className="flex flex-col gap-1 text-[13.5px]">
            <span className="flex items-center gap-2"><span className="font-medium text-ink">{me.email}</span><Pill kind="ok">{me.role}</Pill></span>
            <span className="font-light text-muted">Last signed in: {me.last_login_at ? stamp(me.last_login_at) : 'now'}</span>
          </div>
        </div>
        <form action={updateAccount} className={fields}>
          <Field id="name" label="Name" wide><input id="name" name="name" required maxLength={120} defaultValue={me.name} className={`${input} sm:max-w-[420px]`} /></Field>
          <div className="flex items-center gap-2 border-t border-line pt-5 text-[14px] font-medium text-ink sm:col-span-2"><KeyRound size={16} className="text-accent" aria-hidden="true" />Change password <span className="text-[12.5px] font-light text-muted">(leave empty to keep it)</span></div>
          <Field id="current" label="Current password"><input id="current" name="current" type="password" autoComplete="current-password" className={input} /></Field>
          <div className="hidden sm:block" />
          <Field id="password" label="New password" hint={`At least ${MIN_PASSWORD} characters.`}><input id="password" name="password" type="password" autoComplete="new-password" className={input} /></Field>
          <Field id="confirm" label="Confirm new password"><input id="confirm" name="confirm" type="password" autoComplete="new-password" className={input} /></Field>
          <div className={actions}><button className={btnPrimary}><Save size={16} aria-hidden="true" />Save</button></div>
        </form>
      </Panel>
    </>
  );
}
