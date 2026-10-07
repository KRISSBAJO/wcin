import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminConfigured } from '@/lib/session';
import { currentUser } from '@/lib/auth';
import { countUsers, MIN_PASSWORD } from '@/lib/users';
import { createFirstAdmin, login } from '../actions';
import AuthShell, { authButton, authError, authInput } from '@/components/admin/AuthShell';
import { LockKeyhole, LogIn, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = { title: 'Admin login', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; setup_error?: string }> }) {
  const { next = '/admin', error, setup_error } = await searchParams;
  if (await currentUser()) redirect(next.startsWith('/admin') ? next : '/admin');
  const firstRun = (await countUsers()) === 0;

  if (firstRun) {
    return (
      <AuthShell>
        <form action={createFirstAdmin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11.5px] font-medium text-accent"><ShieldCheck size={13} aria-hidden="true" />First-time setup</span>
            <h1 className="mt-2 text-[26px] font-medium text-ink">Create your admin account</h1>
            <p className="text-[14px] font-light text-muted">From now on each staff member signs in with their own email and password. Prove it is you with the current admin password from the server, then choose your own.</p>
          </div>
          {!adminConfigured() && <p className={authError}>ADMIN_PASSWORD is not set on the server. Add it to .env and restart.</p>}
          {setup_error && <p role="alert" className={authError}>{setup_error}</p>}
          <div className="flex flex-col gap-1.5"><label htmlFor="name" className="text-[13px] font-medium text-ink">Your name</label><input id="name" name="name" required maxLength={120} autoComplete="name" placeholder="Pastor Chris Adebajo" className={authInput} /></div>
          <div className="flex flex-col gap-1.5"><label htmlFor="email" className="text-[13px] font-medium text-ink">Your email</label><input id="email" name="email" type="email" required maxLength={200} autoComplete="email" className={authInput} /></div>
          <div className="flex flex-col gap-1.5"><label htmlFor="password" className="text-[13px] font-medium text-ink">New password</label><input id="password" name="password" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className={authInput} /><span className="text-[12px] font-light text-muted">At least {MIN_PASSWORD} characters.</span></div>
          <div className="flex flex-col gap-1.5"><label htmlFor="setup" className="text-[13px] font-medium text-ink">Current admin password (from .env)</label><input id="setup" name="setup" type="password" required autoComplete="off" className={authInput} /></div>
          <button type="submit" className={authButton}><ShieldCheck size={16} aria-hidden="true" />Create account and sign in</button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <form action={login} className="flex flex-col gap-5">
        <input type="hidden" name="next" value={next} />
        <div className="flex flex-col gap-1">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11.5px] font-medium text-accent"><LockKeyhole size={13} aria-hidden="true" />Staff only</span>
          <h1 className="mt-2 text-[26px] font-medium text-ink">Welcome back</h1>
          <p className="text-[14px] font-light text-muted">Sign in to manage the website.</p>
        </div>
        {error === 'invite' && <p role="alert" className={authError}>That invite link has expired or was already used. Ask an admin to send a new one.</p>}
        {error && error !== 'invite' && <p role="alert" className={authError}>That email or password is not right. Try again.</p>}
        <div className="flex flex-col gap-1.5"><label htmlFor="email" className="text-[13px] font-medium text-ink">Email</label><input id="email" name="email" type="email" required autoComplete="email" autoFocus className={authInput} /></div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between"><label htmlFor="password" className="text-[13px] font-medium text-ink">Password</label><Link href="/admin/forgot" className="text-[12.5px] font-light text-muted no-underline hover:text-ink">Forgot password?</Link></div>
          <input id="password" name="password" type="password" required autoComplete="current-password" className={authInput} />
        </div>
        <button type="submit" className={authButton}><LogIn size={16} aria-hidden="true" />Sign in</button>
      </form>
    </AuthShell>
  );
}
