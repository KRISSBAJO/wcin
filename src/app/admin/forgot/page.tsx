import type { Metadata } from 'next';
import { requestReset } from '../actions';
import AuthShell, { authButton, authError, authInput, authOk } from '@/components/admin/AuthShell';
import { KeyRound, Send } from 'lucide-react';

export const metadata: Metadata = { title: 'Forgot password', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ sent?: string; expired?: string }> }) {
  const { sent, expired } = await searchParams;
  return (
    <AuthShell back={{ href: '/admin/login', label: 'Back to sign in' }}>
      <form action={requestReset} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11.5px] font-medium text-accent"><KeyRound size={13} aria-hidden="true" />Password reset</span>
          <h1 className="mt-2 text-[26px] font-medium text-ink">Forgot your password?</h1>
          <p className="text-[14px] font-light text-muted">Enter your email and we will send a link to choose a new one. The link works for one hour.</p>
        </div>
        {sent && <p role="status" className={authOk}>If that email has an account, a reset link is on its way. Check your inbox and spam folder.</p>}
        {expired && <p role="alert" className={authError}>That reset link has expired or was already used. Ask for a new one below.</p>}
        <div className="flex flex-col gap-1.5"><label htmlFor="email" className="text-[13px] font-medium text-ink">Email</label><input id="email" name="email" type="email" required autoComplete="email" autoFocus className={authInput} /></div>
        <button type="submit" className={authButton}><Send size={16} aria-hidden="true" />Send reset link</button>
      </form>
    </AuthShell>
  );
}
