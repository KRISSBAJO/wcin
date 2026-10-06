// Map embed for the church address.
// Uses `mapEmbedUrl` from site.ts if set; otherwise builds a Google Maps Embed API URL from
// NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (restrict the key to this site's domain in Google Cloud).
import { site } from '@/data/site';

export function mapEmbedSrc(): string | null {
  if (site.mapEmbedUrl) return site.mapEmbedUrl;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  // The geocoder cannot place a suite number and falls back to a world map, so the query uses the street only.
  const street = site.address.street.replace(/,?\s*(suite|ste\.?|unit|#)\s*\S+$/i, '');
  const q = `${street}, ${site.address.city}, ${site.address.state} ${site.address.zip}`;
  return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&zoom=15`;
}
