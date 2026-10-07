'use client';

import { useEffect, useRef, useState } from 'react';

/** A number that counts up from zero the first time it scrolls into view. Keeps any suffix like "+". */
export default function CountUp({ value, className }: { value: string; className?: string }) {
  const match = /^(\d[\d,]*)(.*)$/.exec(value.trim());
  const target = match ? Number(match[1].replace(/,/g, '')) : NaN;
  const suffix = match ? match[2] : '';
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<string>(Number.isNaN(target) ? value : '0');

  useEffect(() => {
    if (Number.isNaN(target)) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(String(target)); return; }
    let raf = 0;
    const run = () => {
      const start = performance.now();
      const dur = 1100;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setShown(String(Math.round(target * eased)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { run(); io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target]);

  return <span ref={ref} className={className}>{shown}{suffix}</span>;
}
