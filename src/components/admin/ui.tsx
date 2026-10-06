import Link from 'next/link';
import {
  AlertCircle, ArrowLeft, Calendar, CheckCircle2, Clock, HeartHandshake, Image, Inbox, LayoutDashboard, Mail, MessageSquareQuote, PlaySquare, Settings, Sparkles, Users, CalendarCheck, Pencil, Plus, Search, X, ArrowUp, ArrowDown, ChevronsUpDown, type LucideIcon,
} from 'lucide-react';
import { listHref, toggleHref, type ListState } from '@/lib/list';

export const pageIcons = {
  dashboard: LayoutDashboard, inbox: Inbox, hero: Image, services: Clock, events: Calendar, messages: PlaySquare, ministries: Sparkles, leaders: Users, settings: Settings,
} satisfies Record<string, LucideIcon>;

/** Icon for each public form type, used in the inbox and dashboard. */
export const formIcons: Record<string, LucideIcon> = {
  'prayer-request': HeartHandshake,
  'plan-a-visit': CalendarCheck,
  contact: Mail,
  testimony: MessageSquareQuote,
};

export function Panel({ title, description, icon: Icon, children, className = '' }: { title?: string; description?: string; icon?: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,20,22,0.04)] ${className}`}>
      {(title || description) && (
        <header className="flex flex-col gap-1 border-b border-line px-6 py-4">
          {title && <h2 className="flex items-center gap-2.5 text-[15px] font-semibold text-ink">{Icon && <Icon size={17} className="text-accent" aria-hidden="true" />}{title}</h2>}
          {description && <p className="text-[13px] leading-relaxed text-muted">{description}</p>}
        </header>
      )}
      <div className="flex flex-col gap-5 p-6">{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, icon, children }: { title: string; description?: string; icon?: keyof typeof pageIcons; children?: React.ReactNode }) {
  const Icon = icon ? pageIcons[icon] : null;
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-gold"><Icon size={20} aria-hidden="true" /></span>}
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-medium text-ink">{title}</h1>
          {description && <p className="max-w-[720px] text-[13.5px] leading-relaxed text-muted">{description}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <p role="status" className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-[13.5px] font-medium ${error ? 'border-[#f3c2c7] bg-[#fdf1f2] text-accent-dark' : 'border-[#bfe3c8] bg-[#eef9f1] text-[#1e5631]'}`}>
      {error ? <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />}
      <span>{error || ok}</span>
    </p>
  );
}

export function Pill({ kind = 'muted', children }: { kind?: 'new' | 'ok' | 'muted' | 'warn'; children: React.ReactNode }) {
  const cls =
    kind === 'new' ? 'bg-accent text-white' :
    kind === 'ok' ? 'bg-[#eaf7ee] text-[#1b5e35]' :
    kind === 'warn' ? 'bg-[#fff4dc] text-[#8a5a00]' :
    'bg-paper-2 text-[#5f5f66]';
  const dot =
    kind === 'new' ? 'bg-white' :
    kind === 'ok' ? 'bg-[#2e9e5b]' :
    kind === 'warn' ? 'bg-[#e0a21b]' :
    'bg-[#a8a8ae]';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium capitalize leading-none ${cls}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      {children}
    </span>
  );
}

export function Field({ id, label, hint, children, wide = false }: { id: string; label: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink">{label}</label>
      {children}
      {hint && <span className="text-[12px] leading-relaxed text-muted">{hint}</span>}
    </div>
  );
}

export const input = 'w-full rounded-lg border border-[#d6d6db] bg-white px-3.5 py-2.5 text-[14px] text-ink shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] placeholder:text-[#a0a0a6] focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 disabled:bg-paper-2 file:mr-3 file:rounded-md file:border-0 file:bg-paper-2 file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-ink';
export const fields = 'grid grid-cols-1 gap-4 sm:grid-cols-2';
export const actions = 'flex flex-wrap items-center gap-3 border-t border-line pt-5 sm:col-span-2';
const btnBase = 'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-[13.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';
export const btn = btnBase;
export const btnPrimary = `${btnBase} bg-accent text-white hover:bg-accent-dark`;
export const btnOutline = `${btnBase} border border-[#d6d6db] bg-white text-ink hover:border-ink`;
export const btnDanger = `${btnBase} border border-[#f3c2c7] bg-white text-accent-dark hover:bg-[#fdf1f2]`;
export const rowLink = 'font-medium text-ink no-underline hover:text-accent';
export const th = 'whitespace-nowrap px-5 py-2.5 text-left text-[11.5px] font-medium uppercase tracking-[0.06em] text-[#9a9aa1] first:pl-6 last:pr-6';
export const td = 'px-5 py-4 align-middle text-[14px] text-ink first:pl-6 last:pr-6';

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="-mx-6 -mb-6 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="border-y border-[#efeff1] bg-[#fafafa]"><tr>{head.map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
        <tbody className="[&_tr]:border-b [&_tr]:border-[#f0f0f2] [&_tr:last-child]:border-0 [&_tr]:transition-colors [&_tr:hover]:bg-[#fafafa]">{children}</tbody>
      </table>
    </div>
  );
}

/**
 * A list page's table in its own card: a toolbar with the title, a count and optional actions,
 * then the rows. Column headings may be right-aligned (for the actions column) or given a width.
 */
export function ListPanel({ title, count, description, icon: Icon, head, children, toolbar, list, searchPlaceholder = 'Search…' }: {
  title: string;
  count?: number;
  description?: string;
  icon?: LucideIcon;
  /** `key` makes a heading sortable (needs `list`). */
  head: { label: string; key?: string; align?: 'left' | 'right'; srOnly?: boolean; width?: string }[];
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  /** Search and sort state carried in the URL; `extra` are other query params to keep (filters). */
  list?: { path: string; state: ListState; extra?: Record<string, string> };
  searchPlaceholder?: string;
}) {
  const heading = (h: (typeof head)[number]) => {
    if (h.srOnly) return <span className="sr-only">{h.label}</span>;
    if (!h.key || !list) return h.label;
    const on = list.state.sort === h.key;
    const Icon = on ? (list.state.dir === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;
    return (
      <Link href={toggleHref(list.path, list.state, h.key, list.extra)} className={`group inline-flex items-center gap-1 no-underline ${on ? 'text-ink' : 'text-[#8a8a92] hover:text-ink'}`} aria-sort={on ? (list.state.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
        {h.label}
        <Icon size={13} className={on ? 'text-accent' : 'opacity-0 transition-opacity group-hover:opacity-100'} aria-hidden="true" />
      </Link>
    );
  };
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,20,22,0.03)]">
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="flex items-center gap-2.5 text-[15px] font-semibold text-ink">
            {Icon && <Icon size={17} className="text-accent" aria-hidden="true" />}
            {title}
            {typeof count === 'number' && <span className="tabular rounded-full bg-paper-2 px-2 py-0.5 text-[11.5px] font-medium text-muted">{count}</span>}
          </h2>
          {description && <p className="text-[13px] text-muted">{description}</p>}
        </div>
        {(toolbar || list) && (
          <div className="flex flex-wrap items-center gap-2">
            {list && <SearchBox path={list.path} state={list.state} extra={list.extra} placeholder={searchPlaceholder} />}
            {toolbar}
          </div>
        )}
      </header>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="border-y border-[#efeff1] bg-[#fafafa]">
            <tr>{head.map((h) => <th key={h.label} style={h.width ? { width: h.width } : undefined} className={`${th} ${h.align === 'right' ? 'text-right' : ''}`}>{heading(h)}</th>)}</tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-[#f0f0f2] [&_tr:last-child]:border-0 [&_tr]:transition-colors [&_tr:hover]:bg-[#fafafa] [&_tr:hover_.row-actions]:opacity-100">{children}</tbody>
        </table>
      </div>
    </section>
  );
}

/** The main cell of a row: a bold title that opens the record, with a quiet line under it. */
export function Primary({ href, title, sub }: { href: string; title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <Link href={href} className="truncate text-[14px] font-semibold text-ink no-underline hover:text-accent">{title}</Link>
      {sub && <span className="mt-0.5 truncate text-[12.5px] text-muted">{sub}</span>}
    </div>
  );
}

/** A square icon button that is a link (edit, download, open). */
export function IconLink({ href, label, icon: Icon, external, download }: { href: string; label: string; icon: LucideIcon; external?: boolean; download?: boolean }) {
  const cls = 'inline-flex h-8 w-8 items-center justify-center rounded-md text-[#8a8a92] transition-colors hover:bg-paper-2 hover:text-ink';
  if (external || download) return <a href={href} title={label} aria-label={label} className={cls} target={external ? '_blank' : undefined} rel={external ? 'noopener' : undefined} download={download || undefined}><Icon size={16} aria-hidden="true" /></a>;
  return <Link href={href} title={label} aria-label={label} className={cls}><Icon size={16} aria-hidden="true" /></Link>;
}

/** Right-aligned row actions; the edit pencil is always included. */
export function RowActions({ edit, children }: { edit: string; children?: React.ReactNode }) {
  return (
    <div className="row-actions flex items-center justify-end gap-0.5 opacity-60 transition-opacity">
      {children}
      <IconLink href={edit} label="Edit" icon={Pencil} />
    </div>
  );
}

/** The "Add …" button for a list page header. */
export function AddLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className={btnPrimary}><Plus size={16} aria-hidden="true" />{label}</Link>;
}

/** Cancel link for a form's action row. */
export function CancelLink({ href }: { href: string }) {
  return <Link href={href} className={btnOutline}>Cancel</Link>;
}

export function Empty({ title, text, action, icon: Icon = Inbox }: { title: string; text?: string; action?: { href: string; label: string }; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-2 text-muted"><Icon size={22} aria-hidden="true" /></span>
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {text && <p className="max-w-[420px] text-[13.5px] text-muted">{text}</p>}
      {action && <Link href={action.href} className={`${btnOutline} mt-2`}>{action.label}</Link>}
    </div>
  );
}

export function Back({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted no-underline hover:text-ink">
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </Link>
  );
}

export function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2.5 text-[13.5px] text-ink sm:col-span-2">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4.5 w-4.5 rounded border-[#d6d6db] accent-accent" /> {label}
    </label>
  );
}

export function Thumb({ src, alt = '', className = '' }: { src: string; alt?: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`rounded-lg bg-paper-2 object-cover ring-1 ring-black/5 ${className}`} />;
}

export function NoThumb({ className = '' }: { className?: string }) {
  return <span className={`flex items-center justify-center rounded-lg bg-paper-2 text-[10px] font-medium uppercase tracking-wider text-[#a8a8ae] ring-1 ring-black/5 ${className}`}>none</span>;
}

/** Search field for a list: a plain GET form, so it works without JavaScript. Keeps the sort and any filters. */
export function SearchBox({ path, state, extra = {}, placeholder = 'Search…' }: { path: string; state: ListState; extra?: Record<string, string>; placeholder?: string }) {
  return (
    <form method="get" action={path} role="search" className="relative">
      {Object.entries(extra).map(([k, v]) => v ? <input key={k} type="hidden" name={k} value={v} /> : null)}
      {state.sort && <input type="hidden" name="sort" value={state.sort} />}
      {state.dir && <input type="hidden" name="dir" value={state.dir} />}
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a92]" aria-hidden="true" />
      <input
        type="search"
        name="q"
        defaultValue={state.q}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-[220px] rounded-lg border border-[#d6d6db] bg-white pl-9 pr-8 text-[13.5px] text-ink placeholder:text-[#a0a0a6] focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 sm:w-[260px] [&::-webkit-search-cancel-button]:hidden"
      />
      {state.q && (
        <Link href={listHref(path, state, { q: '' }, extra)} aria-label="Clear search" className="absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[#8a8a92] hover:bg-paper-2 hover:text-ink">
          <X size={14} aria-hidden="true" />
        </Link>
      )}
    </form>
  );
}

/** One line under a list when a search is active: how many matched, and a way back. */
export function SearchSummary({ shown, total, path, state, extra }: { shown: number; total: number; path: string; state: ListState; extra?: Record<string, string> }) {
  if (!state.q) return null;
  return (
    <p className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
      <span>{shown} of {total} match “{state.q}”.</span>
      <Link href={listHref(path, state, { q: '' }, extra)} className="font-medium text-ink">Show all</Link>
    </p>
  );
}
