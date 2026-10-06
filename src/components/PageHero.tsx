interface Props {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  /** Optional wide photo behind the heading, darkened so the words stay readable. */
  image?: string;
  children?: React.ReactNode;
}

export default function PageHero({ eyebrow, title, lead, image, children }: Props) {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      {image && (
        <div className="absolute inset-0" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,20,22,0.92)_0%,rgba(20,20,22,0.7)_55%,rgba(20,20,22,0.45)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink to-transparent" />
        </div>
      )}
      <div className={`wrap relative grid grid-cols-12 items-end gap-x-6 gap-y-8 py-12 lg:py-22 ${image ? 'lg:min-h-[440px]' : ''}`}>
        <div className={`${children ? 'col-span-12 lg:col-span-8' : 'col-span-12'} flex min-w-0 flex-col gap-5`}>
          <span className="eyebrow text-gold">{eyebrow}</span>
          <h1 className="text-[56px] leading-[0.9] md:text-[80px] lg:text-[104px]">{title}</h1>
          {lead && <p className="max-w-[620px] text-lg leading-[1.5] text-[#d9d9de] lg:text-[21px]">{lead}</p>}
        </div>
        {children && <div className="col-span-12 min-w-0 lg:col-span-4">{children}</div>}
      </div>
    </section>
  );
}
