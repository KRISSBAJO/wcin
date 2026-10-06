import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Analytics from '@/components/Analytics';
import { site } from '@/data/site';
import { getAnnouncement } from '@/lib/content';

// Public pages re-render at most once a minute; admin saves refresh them immediately.
export const revalidate = 60;

const churchSchema = {
  '@context': 'https://schema.org',
  '@type': 'Church',
  name: site.name,
  url: site.url,
  email: site.email,
  parentOrganization: { '@type': 'Organization', name: site.parent },
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.state,
    postalCode: site.address.zip,
    addressCountry: 'US',
  },
  sameAs: [site.social.facebook, site.social.instagram, site.social.youtube],
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const announcement = await getAnnouncement();
  return (
    <>
      <a href="#main" className="absolute left-4 -top-16 z-50 bg-ink px-4 py-2.5 text-white no-underline focus:top-4">Skip to content</a>
      <Header announcement={announcement} />
      <main id="main">{children}</main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(churchSchema) }} />
      <Analytics />
    </>
  );
}
