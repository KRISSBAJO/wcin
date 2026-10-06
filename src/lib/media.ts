/** Adds the download flag the /media route understands; other hosts just get the plain URL. */
export function downloadHref(url: string, name: string): string {
  return url.startsWith('/media/') ? `${url}?download=${encodeURIComponent(name)}` : url;
}
