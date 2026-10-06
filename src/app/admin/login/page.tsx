import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { site } from '@/data/site';
import { adminConfigured } from '@/lib/session';
import { isAdmin } from '@/lib/auth';
import { login } from '../actions';
import { input } from '@/components/admin/ui';
import { LockKeyhole, LogIn } from 'lucide-react';

export const metadata: Metadata = { title: 'Admin login', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = '/admin', error } = await searchParams;
  if (await isAdmin()) redirect(next.startsWith('/admin') ? next : '/admin');
  return (
    <div className="grid min-h-screen bg-[#f4f5f7] lg:grid-cols-[5fr_4fr]">
      <div className="relative hidden overflow-hidden bg-ink text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero/sunday-service-v3.svg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/20" />
        <div className="relative flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-11 w-11 rounded-lg bg-white object-contain p-1" />
          <span className="text-sm font-bold uppercase tracking-[0.16em]">{site.shortName}</span>
        </div>
        <div className="relative flex flex-col gap-4">
          <p className="font-display text-6xl leading-[0.95]">Everything the website shows, in one place.</p>
          <p className="max-w-[460px] text-[17px] text-muted-dark">Flyers, service times, events, messages, leaders and every form submission.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form action={login} className="flex w-full max-w-[400px] flex-col gap-5 rounded-2xl border border-line bg-white p-8 shadow-[0_1px_2px_rgba(20,20,22,0.04)]">
          <input type="hidden" name="next" value={next} />
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-accent"><LockKeyhole size={14} aria-hidden="true" />Admin</span>
            <h1 className="text-[24px] font-semibold">Sign in</h1>
            <p className="text-sm text-muted">Enter the admin password to continue.</p>
          </div>
          {!adminConfigured() && <p className="rounded-xl border border-[#f3c2c7] bg-[#fdf1f2] px-4 py-3 text-sm font-semibold text-accent-dark">ADMIN_PASSWORD is not set on the server. Add it to .env and restart.</p>}
          {error && <p role="alert" className="rounded-xl border border-[#f3c2c7] bg-[#fdf1f2] px-4 py-3 text-sm font-semibold text-accent-dark">Wrong password. Try again.</p>}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[13px] font-medium">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus className={input} />
          </div>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-[13.5px] font-medium text-white hover:bg-accent-dark"><LogIn size={16} aria-hidden="true" />Sign in</button>
          <Link href="/" className="text-center text-sm text-muted no-underline hover:text-ink">← Back to the website</Link>
        </form>
      </div>
    </div>
  );
}
