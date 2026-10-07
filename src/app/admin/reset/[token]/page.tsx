import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { findByToken, MIN_PASSWORD } from '@/lib/users';
import { resetPassword } from '../../actions';
import AuthShell, { authButton, authError, authInput } from '@/components/admin/AuthShell';
import { Check, KeyRound } from 'lucide-react';

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ResetPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ token }, { error }] = await Promise.all([params, searchParams]);
  const user = await findByToken(token, 'reset');
  if (!user) redirect('/admin/forgot?expired=1');
  return (
    <AuthShell back={{ href: '/admin/login', label: 'Back to sign in' }}>
      <form action={resetPassword} className="flex flex-col gap-5">
        <input type="hidden" name="token" value={token} />
        <div className="flex flex-col gap-1">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11.5px] font-medium text-accent"><KeyRound size={13} aria-hidden="true" />Password reset</span>
          <h1 className="mt-2 text-[26px] font-medium text-ink">Choose a new password</h1>
          <p className="text-[14px] font-light text-muted">For <strong className="font-medium text-ink">{user.email}</strong>.</p>
        </div>
        {error && <p role="alert" className={authError}>{error}</p>}
        <div className="flex flex-col gap-1.5"><label htmlFor="password" className="text-[13px] font-medium text-ink">New password</label><input id="password" name="password" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" autoFocus className={authInput} /><span className="text-[12px] font-light text-muted">At least {MIN_PASSWORD} characters.</span></div>
        <div className="flex flex-col gap-1.5"><label htmlFor="confirm" className="text-[13px] font-medium text-ink">Confirm new password</label><input id="confirm" name="confirm" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className={authInput} /></div>
        <button type="submit" className={authButton}><Check size={16} aria-hidden="true" />Save and sign in</button>
      </form>
    </AuthShell>
  );
}
