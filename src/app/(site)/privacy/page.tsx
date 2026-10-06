import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import { site } from '@/data/site';
import { analyticsEnabled } from '@/components/Analytics';

export const metadata: Metadata = {
  title: 'Privacy',
  description: `How ${site.name} handles the information you share with us.`,
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Privacy" title="Your information" lead="A plain-language note on what we collect and how we use it." />
      <section className="section">
        <div className="wrap flex max-w-[760px] flex-col gap-4 text-lg leading-[1.6] text-body [&_h2]:mt-4 [&_h2]:text-4xl [&_h2]:text-ink">
          <h2>What we collect</h2>
          <p>When you fill in a form on this site (plan a visit, contact, prayer request, testimony) we receive what you type: usually your name, email, phone number and your message.</p>
          <h2>How we use it</h2>
          <p>To reply to you, to welcome you on a Sunday, and to pray for you. Prayer requests are seen only by the prayer team and pastors. We do not sell or share your details with anyone outside the church.</p>
          <h2>Giving</h2>
          <p>Online gifts are processed by a third-party payment provider on their own secure pages. We never see or store card numbers. We keep giving records to issue annual statements.</p>
          <h2>Cookies and analytics</h2>
          {analyticsEnabled() ? (
            <p>We use visitor analytics to see how many people use the site and which pages help most. The data is aggregated, IP addresses are anonymised, and we do not use it to identify you or for advertising. {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? 'Google Analytics sets a small cookie for this; ' : ''}you can block it with your browser&apos;s tracking protection without losing any part of the site.</p>
          ) : (
            <p>This site does not set tracking cookies. If analytics are added later, this page will say so.</p>
          )}
          <h2>Your choices</h2>
          <p>Email <a href={`mailto:${site.email}`}>{site.email}</a> to see, correct or delete the information we hold about you.</p>
          <p className="text-muted">Last updated: October 2026. [Have this reviewed by the church&apos;s legal adviser before launch.]</p>
        </div>
      </section>
    </>
  );
}
