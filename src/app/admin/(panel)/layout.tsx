import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { site } from '@/data/site';
import { isAdmin } from '@/lib/auth';
import { one } from '@/lib/db';
import { logout } from '../actions';
import AdminNav from '@/components/admin/AdminNav';
import { LogOut } from 'lucide-react';

export const metadata: Metadata = { title: { default: 'Admin', template: `%s — Admin · ${site.shortName}` }, robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect('/admin/login');
  let newCount = 0;
  try {
    const r = await one<{ n: number }>("SELECT COUNT(*) AS n FROM submissions WHERE status = 'new'");
    newCount = Number(r?.n ?? 0);
  } catch {}
  const logoutForm = (
    <form action={logout}>
      <button type="submit" title="Log out" aria-label="Log out" className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-dark"><LogOut size={16} aria-hidden="true" /></button>
    </form>
  );
  return (
    <div className="min-h-screen bg-[#f4f5f7] text-ink">
      <AdminNav newCount={newCount} logout={logoutForm} />
      <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-5 py-8 lg:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
