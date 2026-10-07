# Winners Chapel International Nashville — website

[Next.js 15](https://nextjs.org) (App Router, React 19) with [Tailwind CSS 4](https://tailwindcss.com), a [Turso](https://turso.tech) (libSQL) database, and S3 for images. Public pages read events, messages, service times, hero slides and the announcement bar from the database. Forms are stored in the database and shown in a password-protected admin area.

## Run it

```bash
pnpm install
cp .env.example .env     # then fill it in (see below)
pnpm db:migrate          # creates the tables (safe to re-run)
pnpm db:seed             # loads starter content (only into empty tables)
pnpm dev                 # http://127.0.0.1:4321
```

Production:

```bash
pnpm build
pnpm start               # Node server on PORT (default 4321)
```

A `Dockerfile` is included (Next standalone output, `node server.js`).

## Environment

| Variable | What it is |
|---|---|
| `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | Turso URL (`libsql://…`) and token. For local work without Turso: `DATABASE_URL=file:./data/local.db` |
| `ADMIN_PASSWORD`, `SESSION_SECRET` | Login for `/admin`; the secret signs the cookie |
| `MAIL_PROVIDER`, `MAIL_FALLBACK_PROVIDER`, `MAIL_FROM`, `NOTIFY_TO` | Optional email on every form submission. Providers: `resend` (`RESEND_API_KEY`), `relykit` (`RELYKIT_API_KEY`), `smtp` (`SMTP_*`). The fallback is tried when the primary is unset or fails |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` | Image storage for hero slides. Without a bucket, uploads go to `public/uploads/` (development only) |
| `ASSET_BASE_URL` | Optional CloudFront or public-bucket URL. Without it the app serves images at `/media/<key>`, so the bucket can stay private |
| `OPENAI_API_KEY`, `OPENAI_IMAGE_MODEL`, `OPENAI_IMAGE_QUALITY` | Optional. Enables "Generate a flyer with AI" in the admin, and AI drafting when no Anthropic key is set (`OPENAI_TEXT_MODEL`) |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Optional. Claude for "Draft with AI" on events and messages |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional. Shows the map of the church address on the homepage and Visit page (Google Maps Embed API) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` | Optional visitor analytics: Google Analytics 4 and/or Cloudflare Web Analytics. Loads on public pages only; the Privacy page updates itself |
| `HOST`, `PORT` | Where `pnpm start` listens |

## What the backend does

- **Forms** (`/api/forms`): plan a visit, contact, prayer request, testimony. Validated server-side, honeypot, 5 submissions per IP per 10 minutes.
- **Admin** (`/admin`): inbox with filters and unread count; submission detail with reply-by-email, archive, delete. Manage hero flyers, service times, events, messages, ministries (with photos), leaders (with photos), the announcement bar, prophetic focus and live-stream link. Every save refreshes the public pages immediately. All photos upload to S3.
- **Announcement bar**: while a special flyer is live, the red bar at the top announces it automatically ("This Sunday · Showers of Blessing · Oct 11", linking to the flyer's link or Plan a Visit). When it expires the default text from Settings shows again.
- **Hero flyers**: the homepage hero shows one panel per service day (Sunday, Wednesday, Monday to Friday), each with that day's service card. Every service has a permanent fallback flyer (set under Services; starter SVGs live in `public/hero/`). A special flyer is uploaded for a service day and a date, shows immediately, and expires 12 hours after that day's last service ends, after which the fallback returns on its own. Expired flyers stay listed in the admin.
- **AI drafting** (optional): with `ANTHROPIC_API_KEY` (Claude, via the official SDK) or `OPENAI_API_KEY`, the Events and Messages admin pages get a "Draft with AI" box. Describe an event in a sentence and the title, detail line, dates and an announcement line are filled in. Paste sermon notes or a YouTube link and the message title, two-sentence description and key points are filled in. Everything stays editable before saving. Code in `src/lib/llm.ts` and `src/lib/ai-drafts.ts`.
- **Site photos**: Settings has four named photo slots (prophetic focus artwork, mandate photo, About page banner, "one church, many nations"). Upload once; each appears in its fixed place. Events take an optional flyer or photo shown on the Events page and homepage cards. Messages with a YouTube link get the video's own thumbnail automatically (`youtubeThumb` in `src/lib/dates.ts`), so sermons need no upload.
- **Staff accounts and roles**: each person signs in at /admin/login with their own email and password (scrypt-hashed, no plain text stored). Roles: *admin* (everything, including Users and Settings) and *editor* (content and the inbox). Admins invite people from /admin/users; the invitee gets an emailed link to choose a password (7 days), or the link is shown on screen when mail is not configured. "Forgot password" emails a one-hour reset link. The last working admin can never be demoted, deactivated or deleted. First run: with no users yet, /admin/login asks for the `ADMIN_PASSWORD` from .env once to create the first admin account; after that the .env password is not used for sign-in (keep `SESSION_SECRET` set so sessions stay valid if you remove it).
- **YouTube sync**: Messages has a "Sync from YouTube" button. It reads the channel Videos tab, Streams tab or a playlist set under Settings (no API key; it parses the page YouTube serves to browsers, see `src/lib/youtube.ts`), adds the latest 12 videos as messages with title, exact upload date, length and a short description, and skips ones already present. Thumbnails come from YouTube. If YouTube changes its page markup the parser needs updating; the rest of the site is unaffected.
- **Hero video**: Settings has a "Homepage hero video" panel. Upload a 10 to 20 second silent MP4 (H.264) or WebM under 80 MB and it plays muted and looping behind the homepage headline, under a dark gradient so the words stay readable; the flyer panel sits on top. Skipped for visitors who prefer reduced motion. Stored like images; `/media` serves byte ranges so playback starts at once (Safari requires this).
- **Multi-day specials**: a special flyer has a first day and an optional last day (Week of Spiritual Emphasis runs Wednesday to Friday and replaces the Midweek panel). It stays live until 12 hours after the last day's service, and the announcement bar reads "Wednesday to Friday · … · October 7 to 9".
- **AI flyers** (optional): with `OPENAI_API_KEY` set, the "Generate with AI" button on the Add a special flyer form opens a dialog. OpenAI draws the background only; the app lays out the flyer in the church's house style (logo, "Join us this … for", gold bevelled title, date and start time, address block, leader cut-out with name and role) in the brand fonts (`src/lib/flyer.ts`, fonts in `public/fonts/`, both under the Open Font Licence). "Use this flyer" attaches the result to the form, and the slide is created on submit like an upload. To put a pastor on the flyer, give them a photo under Leaders and pick them in the dialog. When a photo is uploaded the app asks OpenAI for a transparent-background cut-out and stores it alongside (one image call, about 20 seconds; there is also a "Make cut-out with AI" button on the leader page). In cut-out mode the real photo is placed on the artwork and the AI never redraws a face; in paint mode the AI blends the person into the scene from their photo. A leader can be hidden from the About page and still be used on flyers.
- **Images** (`/media/<key>`): streamed from the private S3 bucket with a one-year cache header.
- **Caching**: public pages are cached for 60 seconds and revalidated on admin saves.

## Where things live

| What | Where |
|---|---|
| Church facts: name, address, phone, social links, giving links; starter content | `src/data/site.ts` |
| Public pages | `src/app/(site)/*/page.tsx` |
| Admin pages and server actions | `src/app/admin/`, `src/app/admin/actions.ts` |
| API routes | `src/app/api/forms/route.ts`, `src/app/media/[...key]/route.ts` |
| Components | `src/components/` (`HeroSlides`, `Header`, `SiteForm`, admin UI) |
| Database schema and queries | `src/lib/schema.ts`, `src/lib/db.ts`, `src/lib/content.ts` |
| Auth, forms, email, storage | `src/lib/session.ts`, `src/lib/auth.ts`, `src/lib/forms.ts`, `src/lib/notify.ts`, `src/lib/storage.ts` |
| Theme (colours, fonts, utilities) | `src/app/globals.css` |

## Before launch

Everything marked `[LIKE THIS]` is a placeholder:

1. Phone number and text-to-give number (`src/data/site.ts`). Address, giving link, live stream and leaders are already set.
2. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in the env for the map boxes.
3. Leader photos in Admin → Leaders.
4. Photos for the Ministries page.
5. Analytics IDs if you want visitor numbers (see Environment).
6. `url` in `site.ts`: the final domain. Add `public/og.png` (1200×630).
7. Change `ADMIN_PASSWORD` to something the office will remember. Consider a smaller `logo.png` (the current one is 2480 px wide).

## Vercel frontend and Render backend

Deploy the same main branch to both hosts. Render runs Node 22, `pnpm install --frozen-lockfile && pnpm build`, then `pnpm start`, with `/api/health` as its database health check. Set the existing database, S3, mail, session and optional AI environment variables on Render only. Leave BACKEND_ORIGIN unset there.

On Vercel, set BACKEND_ORIGIN to the HTTPS Render origin and the public Maps/analytics keys as needed. Public pages request published content from Render, with no database credentials on Vercel. Forms are rewritten to Render; media URLs point directly to Render, with a rewrite retained for older links. Byte-range responses are not shared-cacheable. `/admin` redirects to Render so staff sessions and large uploads stay on a single backend origin. Published content refreshes on public requests; backend settings and services caches last at most one minute.

Local full-stack preview: `NODE_OPTIONS=--use-system-ca pnpm dev` on Windows when the network certificate is trusted by Windows. No TLS validation is disabled. For Docker only, DOCKER_BUILD=1 enables Next standalone output.
