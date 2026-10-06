import { getServices } from '@/lib/content';
import Icon from './Icon';

export default async function ServiceTimes() {
  const services = await getServices();
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
      {services.map((s, i) => {
        const dark = i === services.length - 1;
        return (
          <div key={s.id} className={`flex flex-col gap-2.5 px-7 py-8 ${dark ? 'bg-ink text-white' : 'bg-paper-2'}`}>
            <span className={`flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-gold' : 'text-muted'}`}><Icon name="clock" size={14} />{s.day}</span>
            <span className="font-display text-4xl leading-none lg:text-5xl">{s.time}</span>
            <span className={`text-base ${dark ? 'text-muted-dark' : 'text-body'}`}>{[s.label, s.note].filter(Boolean).join(' · ')}</span>
          </div>
        );
      })}
    </div>
  );
}
