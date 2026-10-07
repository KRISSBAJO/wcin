import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { site } from '@/data/site';
import { getSettings } from '@/lib/content';

/** The dark, video-backed frame shared by sign-in, forgot-password, invite and reset pages. */
export default async function AuthShell({ children, back = { href: '/', label: `Back to ${site.shortName}` } }: { children: React.ReactNode; back?: { href: string; label: string } | null }) {
  const settings = await getSettings();
  const video = settings.hero_video_url;
  const poster = settings.hero_video_poster_url || settings.photo_about_url || '';
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink p-6 text-white">
      <div className="absolute inset-0" aria-hidden="true">
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {video && <video src={video} poster={poster || undefined} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden" />}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,20,22,0.66)_0%,rgba(20,20,22,0.9)_70%,rgba(20,20,22,0.96)_100%)]" />
        {!video && !poster && <div className="absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full bg-accent/25 blur-[120px]" />}
      </div>
      <div className="relative flex w-full max-w-[420px] flex-col gap-6">
        <div className="flex items-center justify-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-11 w-11 rounded-xl bg-white object-contain p-1 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]" />
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-medium">WCI Nashville</span>
            <span className="text-[11px] font-light uppercase tracking-[0.18em] text-[#c9c9cf]">Admin</span>
          </span>
        </div>
        <div className="flex flex-col gap-5 rounded-2xl bg-white p-7 text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] ring-1 ring-white/10 sm:p-8">{children}</div>
        {back && <Link href={back.href} className="inline-flex items-center justify-center gap-1.5 text-[13px] font-light text-[#c9c9cf] no-underline transition-colors hover:text-white"><ArrowLeft size={14} aria-hidden="true" />{back.label}</Link>}
      </div>
    </div>
  );
}

export const authInput = 'h-12 w-full rounded-xl border border-[#d6d6db] bg-white px-4 text-[15px] text-ink placeholder:text-[#a0a0a6] focus:border-ink focus:outline-none focus:ring-4 focus:ring-ink/10';
export const authButton = 'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[14.5px] font-medium text-white transition-colors hover:bg-accent-dark';
export const authError = 'rounded-xl border border-[#f3c2c7] bg-[#fdf1f2] px-4 py-3 text-[13.5px] font-medium text-accent-dark';
export const authOk = 'rounded-xl border border-[#bfe3c8] bg-[#eef9f1] px-4 py-3 text-[13.5px] font-medium text-[#1e5631]';
