import Script from 'next/script';

/**
 * Visitor analytics, switched on by environment variables:
 *   NEXT_PUBLIC_GA_MEASUREMENT_ID   Google Analytics 4, e.g. G-XXXXXXXXXX
 *   NEXT_PUBLIC_CF_ANALYTICS_TOKEN  Cloudflare Web Analytics token (cookie-free)
 * Either, both, or neither. Nothing loads on the admin pages.
 */
export function analyticsEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN);
}

export default function Analytics() {
  const ga = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const cf = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;
  if (!ga && !cf) return null;
  return (
    <>
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga.replace(/[^A-Za-z0-9-]/g, '')}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {cf && (
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={JSON.stringify({ token: cf })}
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
