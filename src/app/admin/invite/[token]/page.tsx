import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { findByToken, MIN_PASSWORD } from '@/lib/users';
import { acceptInvite } from '../../actions';
import AuthShell, { authButton, authError, authInput } from '@/components/admin/AuthShell';
import { Check, UserPlus } from 'lucide-react';

export const metadata: Metadata = { title: 'Accept invite', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ token }, { error }] = await Promise.all([params, searchParams]);
  const user = await findByToken(token, 'invite');
  if (!user) redirect('/admin/login?error=invite');
  return (
    <AuthShell back={null}>
      <form action={acceptInvite} className="flex flex-col gap-5">
        <input type="hidden" name="token" value={token} />
        <div className="flex flex-col gap-1">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11.5px] font-medium text-accent"><UserPlus size={13} aria-hidden="true" />You are invited</span>
          <h1 className="mt-2 text-[26px] font-medium text-ink">Welcome, {user.name.split(' ')[0]}</h1>
          <p className="text-[14px] font-light text-muted">You have been given <strong className="font-medium text-ink">{user.role}</strong> access as <strong className="font-medium text-ink">{user.email}</strong>. Choose a password to finish.</p>
        </div>
        {error && <p role="alert" className={authError}>{error}</p>}
        <div className="flex flex-col gap-1.5"><label htmlFor="password" className="text-[13px] font-medium text-ink">Password</label><input id="password" name="password" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" autoFocus className={authInput} /><span className="text-[12px] font-light text-muted">At least {MIN_PASSWORD} characters.</span></div>
        <div className="flex flex-col gap-1.5"><label htmlFor="confirm" className="text-[13px] font-medium text-ink">Confirm password</label><input id="confirm" name="confirm" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className={authInput} /></div>
        <button type="submit" className={authButton}><Check size={16} aria-hidden="true" />Set password and sign in</button>
      </form>
    </AuthShell>
  );
}
