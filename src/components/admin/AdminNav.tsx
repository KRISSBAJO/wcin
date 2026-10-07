'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Inbox, Image, Clock, Calendar, PlaySquare, Sparkles, Users, Settings, ExternalLink, Menu, X, UserCog } from 'lucide-react';

const PRIMARY = ['/admin', '/admin/inbox', '/admin/hero', '/admin/events', '/admin/messages'];

const links = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/inbox', label: 'Inbox', Icon: Inbox },
  { href: '/admin/hero', label: 'Hero', Icon: Image },
  { href: '/admin/services', label: 'Services', Icon: Clock },
  { href: '/admin/events', label: 'Events', Icon: Calendar },
  { href: '/admin/messages', label: 'Messages', Icon: PlaySquare },
  { href: '/admin/ministries', label: 'Ministries', Icon: Sparkles },
  { href: '/admin/leaders', label: 'Leaders', Icon: Users },
  { href: '/admin/settings', label: 'Settings', Icon: Settings, admin: true },
  { href: '/admin/users', label: 'Users', Icon: UserCog, admin: true },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length ? (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() : '?';
}

export default function AdminNav({ newCount, logout, user }: { newCount: number; logout: React.ReactNode; user: { name: string; role: 'admin' | 'editor' } }) {
  const visible = links.filter((l) => !l.admin || user.role === 'admin');
  const bar = visible.filter((l) => PRIMARY.includes(l.href));
  const dock = visible.filter((l) => !PRIMARY.includes(l.href));
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const active = (href: string) =>
    href === '/admin' ? path === '/admin' : href === '/admin/inbox' ? path === '/admin/inbox' || path.startsWith('/admin/submissions') : path.startsWith(href);

  return (
    <header className="sticky top-0 z-30 bg-ink text-white shadow-[0_1px_0_rgba(255,255,255,0.08)]">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-5 lg:px-8">
        <Link href="/admin" className="flex shrink-0 items-center gap-3 py-3 no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-9 w-9 rounded-md bg-white object-contain p-0.5" />
          <span className="flex flex-col leading-tight">
            <span className="text-[13px] font-bold tracking-[-0.01em] text-white">WCI Nashville</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#8a8a92]">Admin</span>
          </span>
        </Link>

        <nav aria-label="Admin" className="hidden items-stretch lg:flex">
          {bar.map(({ href, label, Icon }) => {
            const on = active(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? 'page' : undefined}
                title={label}
                className={`relative flex items-center gap-2 px-3 py-5 text-[13.5px] font-medium no-underline transition-colors xl:px-4 ${on ? 'text-white' : 'text-[#c9c9cf] hover:text-white'}`}
              >
                <Icon size={18} className={on ? 'text-gold' : 'text-[#8a8a92]'} aria-hidden="true" />
                <span>{label}</span>
                {href === '/admin/inbox' && newCount > 0 && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{newCount}</span>}
                {on && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-accent" />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-1 lg:flex">
          <a href="/" target="_blank" rel="noopener" title="View site" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium text-[#c9c9cf] no-underline hover:bg-white/10 hover:text-white">
            <ExternalLink size={16} aria-hidden="true" /><span className="hidden xl:inline">View site</span>
          </a>
          <Link href="/admin/account" title={`${user.name} · ${user.role}`} className="ml-1 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 no-underline hover:bg-white/10">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/90 text-[12px] font-medium text-ink">{initials(user.name)}</span>
            <span className="hidden flex-col leading-tight xl:flex">
              <span className="text-[12.5px] font-medium text-white">{user.name.split(' ')[0]}</span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-[#8a8a92]">{user.role}</span>
            </span>
          </Link>
          {logout}
        </div>

        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 lg:hidden">
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {/* Floating dock: the less-used sections stay one click away while the page scrolls. */}
      {dock.length > 0 && (
        <nav aria-label="More sections" className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-1 rounded-2xl bg-ink/95 p-1.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur lg:flex">
          {dock.map(({ href, label, Icon }) => {
            const on = active(href);
            return (
              <Link key={href} href={href} aria-current={on ? 'page' : undefined} className={`group relative flex h-11 w-11 items-center justify-center rounded-xl no-underline transition-colors ${on ? 'bg-accent text-white' : 'text-[#c9c9cf] hover:bg-white/10 hover:text-white'}`}>
                <Icon size={19} aria-hidden="true" />
                <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {open && (
        <nav aria-label="Admin" className="flex flex-col border-t border-white/10 px-3 py-2 lg:hidden">
          {visible.map(({ href, label, Icon }) => (
            <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium no-underline ${active(href) ? 'bg-white/10 text-white' : 'text-[#c9c9cf]'}`}>
              <Icon size={18} className={active(href) ? 'text-gold' : 'text-[#8a8a92]'} aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {href === '/admin/inbox' && newCount > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">{newCount}</span>}
            </Link>
          ))}
          <Link href="/admin/account" className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium text-[#c9c9cf] no-underline"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/90 text-[11px] font-medium text-ink">{initials(user.name)}</span>{user.name} <span className="text-[11px] uppercase tracking-[0.14em] text-[#8a8a92]">{user.role}</span></Link>
          <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-semibold text-[#c9c9cf] no-underline"><ExternalLink size={18} aria-hidden="true" />View site</a>
          <div className="flex items-center justify-between px-3 py-3 text-[15px] font-semibold text-[#c9c9cf]"><span>Log out</span>{logout}</div>
        </nav>
      )}
    </header>
  );
}
