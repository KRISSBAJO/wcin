'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';
import { Calendar, CalendarDays, Heart, Info, Mail, PlayCircle, Sparkles, ChevronRight, type LucideIcon } from 'lucide-react';

const navIcons: Record<string, LucideIcon> = { '/about': Info, '/visit': CalendarDays, '/ministries': Sparkles, '/watch': PlayCircle, '/events': Calendar, '/contact': Mail };
import { nav, site } from '@/data/site';

interface Props {
  announcement: { text: string; linkText: string; href: string };
}

export default function Header({ announcement }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  const linkCls = (href: string) =>
    `no-underline font-semibold whitespace-nowrap ${pathname === href ? 'text-accent xl:border-b-2 xl:border-accent xl:pb-0.5' : 'text-ink hover:text-accent'}`;

  return (
    <>
      {announcement.text && (
        <div className="bg-accent text-white text-sm font-semibold uppercase tracking-[0.04em]">
          <div className="wrap flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-2.5 text-center leading-[1.4]">
            <span>{announcement.text}</span>
            {announcement.linkText && announcement.href && (
              <Link href={announcement.href} className="text-white underline underline-offset-[3px]">{announcement.linkText}</Link>
            )}
          </div>
        </div>
      )}
      <header className={`site-header sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur ${scrolled ? 'is-scrolled' : ''}`}>
        <div className={`header-row wrap flex items-center justify-between gap-3 sm:gap-6 ${scrolled ? 'py-2' : 'py-4'}`}>
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3 no-underline text-ink hover:text-ink" aria-label={`${site.name} home`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" width={56} height={63} className={`header-logo w-auto shrink-0 ${scrolled ? 'h-10 xl:h-11' : 'h-10 sm:h-12 xl:h-14'}`} />
            <span className="flex min-w-0 flex-col leading-[1.05]">
              <span className="font-display text-[18px] tracking-[0.02em] sm:text-xl xl:text-2xl">Winners Chapel<span className="block sm:inline"> International</span></span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted sm:text-[11px] xl:text-xs">Nashville<span className="hidden md:inline"> &middot; {site.parent}</span></span>
            </span>
          </Link>

          <nav
            id="site-nav"
            aria-label="Primary"
            className={`${open ? 'flex' : 'hidden'} absolute inset-x-0 top-full flex-col border-b border-line bg-white shadow-[0_16px_32px_rgba(0,0,0,0.12)] xl:static xl:flex xl:flex-row xl:items-center xl:gap-5 xl:border-0 xl:bg-transparent xl:shadow-none xl:gap-7`}
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                className={`${linkCls(item.href)} flex min-h-[52px] items-center border-t border-line px-4 sm:px-8 xl:min-h-0 xl:border-0 xl:px-0 ${pathname === item.href ? 'border-l-4 border-l-accent xl:border-l-0' : ''}`}
              >
                {(() => { const I = navIcons[item.href]; return I ? <I size={18} className={`mr-3 xl:hidden ${pathname === item.href ? 'text-accent' : 'text-muted'}`} aria-hidden="true" /> : null; })()}
                {item.label}
                <ChevronRight size={18} className="ml-auto text-muted xl:hidden" aria-hidden="true" />
              </Link>
            ))}
            <Link href="/give" className="btn btn-primary btn-small mx-4 my-3 sm:hidden xl:mx-0 xl:my-0 xl:inline-flex"><Heart size={14} aria-hidden="true" />Give</Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2 xl:hidden">
            <Link href="/give" className="btn btn-primary btn-small hidden sm:inline-flex"><Heart size={14} aria-hidden="true" />Give</Link>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center border border-[#d0d0d4] bg-white text-ink"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="site-nav"
              onClick={() => setOpen((v) => !v)}
            >
              <Icon name={open ? 'close' : 'menu'} size={22} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
