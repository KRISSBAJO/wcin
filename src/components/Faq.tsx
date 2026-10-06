import { Minus, Plus } from 'lucide-react';

interface Item {
  q: string;
  a: React.ReactNode;
}

export default function Faq({ items }: { items: Item[] }) {
  return (
    <div className="flex flex-col border-t border-[#d0d0d4]">
      {items.map((f) => (
        <details key={f.q} className="group border-b border-[#d0d0d4]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-xl font-bold [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-2 text-accent group-open:hidden"><Plus size={20} aria-hidden="true" /></span>
            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white group-open:flex"><Minus size={20} aria-hidden="true" /></span>
          </summary>
          <p className="pb-5 text-[17px] leading-[1.5] text-body">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
