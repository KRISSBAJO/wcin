'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Scroll reveal for the public site. Elements marked `data-reveal` fade up once when they enter
 * the screen; `data-reveal-group` staggers its direct children. Does nothing (shows everything)
 * when the visitor prefers reduced motion or JavaScript is off.
 */
export default function Motion() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('has-js');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-group]'));
    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('is-in'));
      return;
    }
    for (const group of document.querySelectorAll<HTMLElement>('[data-reveal-group]')) {
      Array.from(group.children).forEach((child, i) => {
        (child as HTMLElement).style.transitionDelay = `${Math.min(i, 9) * 80}ms`;
        child.classList.add('reveal-item');
      });
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    targets.forEach((t) => {
      // Anything already on screen at load shows at once, so the first screen never waits.
      const r = t.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) t.classList.add('is-in');
      else io.observe(t);
    });
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
