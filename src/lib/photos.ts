// Named photo slots used around the site, each uploaded once under Settings.
export const PHOTO_SLOTS = {
  focus: { label: 'Prophetic focus artwork', where: 'Watch page, beside the monthly focus', shape: 'Landscape or square' },
  mandate: { label: 'Mandate artwork', where: 'Homepage and About page, as a wide banner above the Liberation Mandate text', shape: 'Wide banner, about 3:1 (for example 2000 × 700)' },
  about: { label: 'About page banner', where: 'Behind the About page heading', shape: 'Wide landscape, 1920 × 800 or larger' },
  nations: { label: 'One church, many nations', where: 'About page, beside the Living Faith links', shape: 'Landscape, e.g. a Shiloh crowd or Canaanland' },
} as const;
export type PhotoSlot = keyof typeof PHOTO_SLOTS;

