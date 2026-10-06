import Link from 'next/link';
import { CalendarDays, Home, Play } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center bg-ink text-white">
      <div className="wrap flex flex-col gap-5 py-20">
        <span className="eyebrow text-gold">404</span>
        <h1 className="text-[64px] leading-[0.9] lg:text-[120px]">That page<br />isn&apos;t here</h1>
        <p className="text-lg text-[#d9d9de] lg:text-[22px]">The link may be old or mistyped. Try one of these instead.</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <Link href="/" className="btn btn-primary"><Home size={16} aria-hidden="true" />Home</Link>
          <Link href="/visit" className="btn btn-outline-light"><CalendarDays size={16} aria-hidden="true" />Plan a visit</Link>
          <Link href="/watch" className="btn btn-outline-light"><Play size={16} fill="currentColor" aria-hidden="true" />Watch</Link>
        </div>
      </div>
    </section>
  );
}
