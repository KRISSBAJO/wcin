// Single place for facts about the church. Edit here and every page updates.
// Anything in [BRACKETS] is a placeholder to replace before launch.

export const site = {
  name: 'Winners Chapel International Nashville',
  shortName: "Winners Chapel Int'l Nashville",
  parent: 'Living Faith Church Worldwide',
  founder: 'Bishop David O. Oyedepo',
  tagline: 'A church where winners are made',
  description:
    'Winners Chapel International Nashville is a branch of Living Faith Church Worldwide. Join us on Sundays at 9:00 AM in Nashville, Tennessee.',
  url: 'https://winnersnashville.org',
  email: 'info@winnersnashville.org',
  phone: '(629) 292-7072',
  phoneHref: 'tel:+16292927072',
  address: {
    street: '5223 Harding Place, Suite 5259',
    city: 'Nashville',
    state: 'TN',
    zip: '37217',
  },
  mapEmbedUrl: '', // Paste a Google Maps embed URL here to show the map.
  mapLinkUrl: 'https://maps.google.com/?q=5223+Harding+Place+Suite+5259+Nashville+TN+37217',
  plantedYear: '2020',
  tagline2: 'Faith · Family · Impact',
  social: {
    facebook: '',
    instagram: '',
    youtube: 'https://www.youtube.com/@lfcww',
  },
  // Where the live stream plays. A YouTube channel "live" URL works well.
  liveStreamUrl: 'https://www.youtube.com/@lfcww/live',
  // Giving links. Replace with the church's own processor links.
  giving: {
    online: 'https://tithe.ly/give_new/www/#/tithely/give-one-time/2338310?widget=1',
    textNumber: '(629) 292-7072',
    textKeyword: 'GIVE',
  },
  // Starter service times. Once seeded, edit these in /admin/services instead.
  services: [
    { day: 'Sunday', start: '9:00 AM', end: '11:00 AM', label: 'Sunday Worship Service', note: 'Doors open 8:30 AM' },
    { day: 'Wednesday', start: '6:00 PM', end: '7:30 PM', label: 'Mid-week service', note: 'Word and prayer' },
    { day: 'Monday to Friday', start: '5:00 AM', end: '6:00 AM', label: 'Covenant Hour of Prayer', note: 'Daily, also online' },
  ] as { day: string; start: string; end?: string; label: string; note: string }[],
  // Default announcement bar. While a special flyer is live, the bar announces that service instead.
  announcement: {
    text: 'Join us this Sunday · 9:00 AM · 5223 Harding Place, Nashville',
    linkText: 'Plan your visit',
    href: '/visit',
  },
};

export const nav = [
  { label: 'About', href: '/about' },
  { label: 'Plan a Visit', href: '/visit' },
  { label: 'Ministries', href: '/ministries' },
  { label: 'Watch', href: '/watch' },
  { label: 'Events', href: '/events' },
  { label: 'Contact', href: '/contact' },
];

export const quickActions = [
  {
    title: 'Prayer request',
    text: 'Our prayer team stands with you. Send a request any time.',
    href: '/prayer',
    icon: 'heart',
  },
  {
    title: 'Share a testimony',
    text: "Tell us what God has done. Your story builds someone's faith.",
    href: '/testimony',
    icon: 'chat',
  },
  {
    title: 'Find a home cell',
    text: 'Small groups meet across Nashville every week.',
    href: '/ministries#home-cells',
    icon: 'people',
  },
  {
    title: 'New here? Start',
    text: "Believers' Foundation Class runs every month.",
    href: '/visit',
    icon: 'book',
  },
];

export const ministries = [
  {
    id: 'wofbi',
    tag: 'Training',
    title: 'Word of Faith Bible Institute',
    text: 'Basic and leadership certificate courses.',
    body:
      'WOFBI is the training arm of Living Faith Church Worldwide, established in 1986. The Basic Certificate Course lays a foundation in the Word; the Leadership Certificate and Diploma courses go deeper. Classes run in the evenings and online.',
    dark: true,
  },
  {
    id: 'kids',
    tag: 'Kids',
    title: 'Winners Kids',
    text: 'Safe, joyful Bible teaching for ages 2 to 12 during the Sunday service at 9:00 AM.',
    body:
      'Children are checked in at the lobby and taught by trained, background-checked volunteers. Each age group has its own room and lesson. Parents are paged if needed.',
  },
  {
    id: 'youth',
    tag: 'Youth',
    title: 'Winners Youth',
    text: 'Teens and young adults growing in faith, purpose and friendship.',
    body:
      'Youth meet on Fridays and serve across the church. Expect worship, honest conversation about faith and life, and friends who have your back.',
  },
  {
    id: 'family',
    tag: 'Family',
    title: 'Christian Family',
    text: 'Marriage, parenting and family life teaching for singles and couples.',
    body:
      'Monthly teaching on marriage as a covenant, raising children, and building a successful home, following the Christian Family column of Pastor Faith Oyedepo.',
  },
  {
    id: 'home-cells',
    tag: 'Groups',
    title: 'Home Cells',
    text: 'Weekly fellowship in homes across Davidson, Rutherford and Williamson counties.',
    body:
      'Home cells are where the church becomes family. Groups of 8 to 15 meet weekly for the Word, prayer and care. Tell us where you live and we will connect you to the nearest cell.',
  },
  {
    id: 'serve',
    tag: 'Serve',
    title: 'Service Units',
    text: 'Ushering, choir, media, protocol, welfare. Join a team and serve.',
    body:
      'Every member serves. Units include ushering, choir, media and sound, protocol, welfare, sanctuary keepers, and children’s ministry. Training is provided.',
  },
];

// Starter events and messages. Once the database is seeded, edit these in /admin instead.
export const events: { title: string; detail: string; date: string; endDate?: string }[] = [
  {
    title: 'Showers of Blessings Service',
    detail: 'Sunday · 9:00 AM · Main sanctuary',
    date: '2026-10-12',
  },
  {
    title: "Believers' Foundation Class",
    detail: 'Saturday · 10:00 AM · For new members and first timers',
    date: '2026-10-18',
  },
  {
    title: 'Covenant Day of Business Breakthrough',
    detail: 'Sunday · 9:00 AM · Bring your business plans for prayer',
    date: '2026-11-02',
  },
  {
    title: 'Shiloh 2026 Viewing Centre',
    detail: 'Dec 8 to 13 · Live from Canaanland, Ota · All sessions',
    date: '2026-12-08',
    endDate: '2026-12-13',
  },
];

export const messages = [
  { date: '2026-09-28', title: 'Covenant Day of Business Breakthrough', speaker: 'Resident Pastor', length: '58 min', href: 'https://www.youtube.com/' },
  { date: '2026-09-21', title: 'Financial Fortune Banquet', speaker: 'Resident Pastor', length: '52 min', href: 'https://www.youtube.com/' },
  { date: '2026-09-14', title: 'Creative Wisdom Is My Heritage', speaker: 'Resident Pastor', length: '61 min', href: 'https://www.youtube.com/' },
  { date: '2026-09-07', title: 'Covenant Day of Restoration', speaker: 'Resident Pastor', length: '55 min', href: 'https://www.youtube.com/' },
];

export const propheticFocus = {
  month: 'October 2026',
  text: 'Creative wisdom is my heritage.',
  scripture: 'Proverbs 8:12',
  pdf: 'https://resources.faithtabernacle.org.ng/',
};

// Starter leadership. Once seeded, edit in /admin/leaders (photos upload there).
export const leaders = [
  { name: 'Bishop David O. Oyedepo', role: 'Presiding Bishop', bio: 'Founder and President of Living Faith Church Worldwide. He received the Liberation Mandate in 1981 and founded the church in 1983. Chancellor of Covenant University and Landmark University.' },
  { name: 'Pastor Chris Adebajo', role: 'Resident Pastor', bio: 'Pastor Chris Adebajo has led Winners Chapel International Nashville since it began in October 2020, raising a family of believers in Middle Tennessee under the Liberation Mandate.' },
];
