import Link from 'next/link';
import Icon from './Icon';
import { site } from '@/data/site';
import { getServices } from '@/lib/content';

const colLink = 'text-muted-dark no-underline hover:text-white min-h-10 inline-flex items-center sm:min-h-0';

export default async function Footer() {
  const services = await getServices();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-ink text-[15px] text-muted-dark">
      <div className="wrap flex flex-col gap-12 pt-12 pb-14 lg:pt-18">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-[2fr_repeat(4,1fr)]">
          <div className="col-span-2 flex flex-col gap-4 lg:col-span-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" width={64} height={72} className="h-16 w-auto self-start rounded bg-white p-1.5" />
            <span className="font-display text-3xl leading-none text-white">{site.name}</span>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">{site.tagline2}</p>
            <p className="leading-[1.6]">A branch of {site.parent}. Founder and President: {site.founder}.</p>
            <div className="mt-1 flex gap-3">
              {[
                ['facebook', site.social.facebook, 'Facebook'],
                ['instagram', site.social.instagram, 'Instagram'],
                ['youtube', site.social.youtube, 'YouTube'],
              ].filter(([, href]) => Boolean(href)).map(([icon, href, label]) => (
                <a key={icon} href={href} aria-label={label} rel="noopener" target="_blank" className="flex h-11 w-11 items-center justify-center border border-line-dark text-white hover:border-white hover:text-white">
                  <Icon name={icon as 'facebook'} size={18} />
                </a>
              ))}
            </div>
          </div>
          <nav className="flex flex-col gap-3" aria-label="Church">
            <span className="text-[13px] font-bold uppercase tracking-[0.16em] text-white">Church</span>
            <Link href="/about" className={colLink}>About us</Link>
            <Link href="/about#mandate" className={colLink}>The mandate</Link>
            <Link href="/about#leadership" className={colLink}>Leadership</Link>
            <Link href="/visit" className={colLink}>Plan a visit</Link>
          </nav>
          <nav className="flex flex-col gap-3" aria-label="Connect">
            <span className="text-[13px] font-bold uppercase tracking-[0.16em] text-white">Connect</span>
            <Link href="/prayer" className={colLink}>Prayer request</Link>
            <Link href="/testimony" className={colLink}>Testimonies</Link>
            <Link href="/ministries#home-cells" className={colLink}>Home cells</Link>
            <Link href="/ministries" className={colLink}>Ministries</Link>
          </nav>
          <nav className="flex flex-col gap-3" aria-label="Resources">
            <span className="text-[13px] font-bold uppercase tracking-[0.16em] text-white">Resources</span>
            <Link href="/watch" className={colLink}>Watch live</Link>
            <Link href="/watch#messages" className={colLink}>Messages</Link>
            <Link href="/watch#focus" className={colLink}>Prophetic focus</Link>
            <Link href="/ministries#wofbi" className={colLink}>WOFBI</Link>
          </nav>
          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-bold uppercase tracking-[0.16em] text-white">Services</span>
            {services.map((s) => <span key={s.id} className="whitespace-nowrap">{s.day} {s.start_time}</span>)}
            <Link href="/give" className="font-bold text-white no-underline hover:text-white">Give online</Link>
          </div>
        </div>
      </div>
      <div className="footer-legal border-t border-line-dark bg-ink text-xs sm:text-sm text-muted-dark">
        <div className="wrap flex flex-col sm:flex-row sm:flex-wrap items-center justify-between gap-x-4 gap-y-0 py-2 sm:py-4">
          <span>© {year} <span className="sm:hidden">Winners Chapel Nashville</span><span className="hidden sm:inline">{site.name}. All rights reserved.</span></span>
          <div className="flex gap-6">
            <Link href="/privacy" className="inline-flex min-h-10 items-center text-white no-underline hover:underline hover:underline-offset-[3px]">Privacy</Link>
            <Link href="/contact" className="inline-flex min-h-10 items-center text-white no-underline hover:underline hover:underline-offset-[3px]">Contact</Link>
            <Link href="/admin" className="inline-flex min-h-10 items-center text-muted-dark no-underline transition-colors hover:text-white hover:underline hover:underline-offset-[3px] focus-visible:text-white" aria-label="Staff login">Staff</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
