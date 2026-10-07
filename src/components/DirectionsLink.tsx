"use client";

import { useEffect, useState, type ReactNode } from 'react';
import { site } from '@/data/site';

const destination = encodeURIComponent(`${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}`);
const googleDirections = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

export default function DirectionsLink({ children, className }: { children: ReactNode; className?: string }) {
  const [href, setHref] = useState(googleDirections);
  useEffect(() => {
    const appleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (appleMobile) setHref(`https://maps.apple.com/?daddr=${destination}&dirflg=d`);
  }, []);
  return <a href={href} className={className} aria-label="Get directions to Winners Chapel, 5223 Harding Place, Suite 5259, Nashville">{children}</a>;
}
