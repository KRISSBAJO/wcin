'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Inbox, Image, Clock, Calendar, PlaySquare, Sparkles, Users, Settings, ExternalLink, Menu, X } from 'lucide-react';

const links = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/inbox', label: 'Inbox', Icon: Inbox },
  { href: '/admin/hero', label: 'Hero', Icon: Image },
  { href: '/admin/services', label: 'Services', Icon: Clock },
  { href: '/admin/events', label: 'Events', Icon: Calendar },
  { href: '/admin/messages', label: 'Messages', Icon: PlaySquare },
  { href: '/admin/ministries', label: 'Ministries', Icon: Sparkles },
  { href: '/admin/leaders', label: 'Leaders', Icon: Users },
  { href: '/admin/settings', label: 'Settings', Icon: Settings },
];

export default function AdminNav({ newCount, logout }: { newCount: number; logout: React.ReactNode }) {
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
          {links.map(({ href, label, Icon }) => {
            const on = active(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? 'page' : undefined}
                title={label}
                className={`relative flex items-center gap-2 px-2.5 py-5 text-[13px] font-medium no-underline transition-colors min-[1360px]:px-3 ${on ? 'text-white' : 'text-[#c9c9cf] hover:text-white'}`}
              >
                <Icon size={18} className={on ? 'text-gold' : 'text-[#8a8a92]'} aria-hidden="true" />
                <span className="hidden min-[1360px]:inline">{label}</span>
                {href === '/admin/inbox' && newCount > 0 && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{newCount}</span>}
                {on && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-accent" />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-1 lg:flex">
          <a href="/" target="_blank" rel="noopener" title="View site" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium text-[#c9c9cf] no-underline hover:bg-white/10 hover:text-white">
            <ExternalLink size={16} aria-hidden="true" /><span className="hidden min-[1360px]:inline">View site</span>
          </a>
          {logout}
        </div>

        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 lg:hidden">
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <nav aria-label="Admin" className="flex flex-col border-t border-white/10 px-3 py-2 lg:hidden">
          {links.map(({ href, label, Icon }) => (
            <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium no-underline ${active(href) ? 'bg-white/10 text-white' : 'text-[#c9c9cf]'}`}>
              <Icon size={18} className={active(href) ? 'text-gold' : 'text-[#8a8a92]'} aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {href === '/admin/inbox' && newCount > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">{newCount}</span>}
            </Link>
          ))}
          <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-semibold text-[#c9c9cf] no-underline"><ExternalLink size={18} aria-hidden="true" />View site</a>
          <div className="flex items-center justify-between px-3 py-3 text-[15px] font-semibold text-[#c9c9cf]"><span>Log out</span>{logout}</div>
        </nav>
      )}
    </header>
  );
}
