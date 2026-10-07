import type { Metadata } from 'next';
import { Bebas_Neue, Jost, Source_Sans_3 } from 'next/font/google';
import { site } from '@/data/site';
import './globals.css';

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas', display: 'swap' });
const jost = Jost({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-jost', display: 'swap' });
const source = Source_Sans_3({ weight: ['400', '600', '700'], style: ['normal', 'italic'], subsets: ['latin'], variable: '--font-source', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s — ${site.shortName}` },
  description: site.description,
  icons: { icon: '/favicon.svg', apple: '/logo.png' },
  openGraph: { type: 'website', siteName: site.name, images: ['/og.png'] },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={`${bebas.variable} ${source.variable} ${jost.variable}`}>
      <body>
        <meta name="theme-color" content="#b3121f" />
        {children}
      </body>
    </html>
  );
}
