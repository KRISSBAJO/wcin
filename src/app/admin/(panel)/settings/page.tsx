import { getSettings } from '@/lib/content';
import { requireManager } from '@/lib/auth';
import { BookOpen, Clapperboard, HandHeart, Images, Megaphone, PlaySquare, Radio, Save, Trash2, Upload } from 'lucide-react';
import { removeHeroVideo, removeSitePhoto, saveSettings, uploadHeroPoster, uploadHeroVideo, uploadSitePhoto } from '../../actions';
import { PHOTO_SLOTS, type PhotoSlot } from '@/lib/photos';
import { Field, Flash, Panel, actions, btnDanger, btnPrimary, fields, input, PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Settings' };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireManager();
  const [sp, s] = await Promise.all([searchParams, getSettings(true)]);
  return (
    <>
      <PageHeader icon="settings" title="Settings" />
      <Flash ok={sp.ok} error={sp.error} />
      <form action={saveSettings} className="flex flex-col gap-6">
        <Panel icon={Megaphone} title="Announcement bar">
          <p className="text-sm text-muted">The red strip at the top of every page. While a special flyer is live, the strip announces that service automatically (for example “This Sunday · Showers of Blessing · Oct 11”). The text below is what shows the rest of the time. Leave it blank to hide the strip.</p>
          <div className={fields}>
            <Field id="announcement_text" label="Text" wide><input id="announcement_text" name="announcement_text" maxLength={200} defaultValue={s.announcement_text} className={input} /></Field>
            <Field id="announcement_link_text" label="Link label"><input id="announcement_link_text" name="announcement_link_text" maxLength={60} defaultValue={s.announcement_link_text} className={input} /></Field>
            <Field id="announcement_href" label="Link goes to"><input id="announcement_href" name="announcement_href" maxLength={500} defaultValue={s.announcement_href} placeholder="/watch" className={input} /></Field>
          </div>
        </Panel>
        <Panel icon={HandHeart} title="Welcome from the pastor">
          <p className="text-[13px] text-muted">The welcome block on the homepage, next to the Resident Pastor&apos;s photo from Leaders. Leave a blank line between paragraphs. Leave the text empty to hide the block.</p>
          <div className={fields}>
            <Field id="welcome_title" label="Heading"><input id="welcome_title" name="welcome_title" maxLength={80} defaultValue={s.welcome_title} className={input} /></Field>
            <Field id="welcome_text" label="Message" hint="Two short paragraphs read best." wide><textarea id="welcome_text" name="welcome_text" maxLength={1500} defaultValue={s.welcome_text} className={`${input} min-h-[160px] resize-y`} /></Field>
          </div>
        </Panel>
        <Panel icon={BookOpen} title="Prophetic focus">
          <div className={fields}>
            <Field id="focus_month" label="Month"><input id="focus_month" name="focus_month" maxLength={40} defaultValue={s.focus_month} className={input} /></Field>
            <Field id="focus_scripture" label="Scripture"><input id="focus_scripture" name="focus_scripture" maxLength={80} defaultValue={s.focus_scripture} className={input} /></Field>
            <Field id="focus_text" label="Declaration" wide><input id="focus_text" name="focus_text" maxLength={300} defaultValue={s.focus_text} className={input} /></Field>
            <Field id="focus_pdf" label="PDF link" wide><input id="focus_pdf" name="focus_pdf" type="url" maxLength={500} defaultValue={s.focus_pdf} className={input} /></Field>
          </div>
        </Panel>
        <Panel icon={PlaySquare} title="YouTube">
          <p className="text-[13px] text-muted">Where "Sync from YouTube" on the Messages page pulls videos from: a channel (its Videos tab) or a playlist link. Each synced video becomes a message with the video&apos;s title, date and a short description; the thumbnail comes from YouTube.</p>
          <div className={fields}>
            <Field id="youtube_source" label="Channel or playlist" hint="For example https://www.youtube.com/@lfcww/videos, or a playlist link such as the channel's sermons playlist."><input id="youtube_source" name="youtube_source" maxLength={500} defaultValue={s.youtube_source} className={input} /></Field>
            <Field id="youtube_speaker" label="Speaker to list for synced videos"><input id="youtube_speaker" name="youtube_speaker" maxLength={120} defaultValue={s.youtube_speaker} className={input} /></Field>
          </div>
        </Panel>
        <Panel icon={Radio} title="Live stream">
          <div className={fields}>
            <Field id="live_stream_url" label="Watch live link" wide><input id="live_stream_url" name="live_stream_url" type="url" maxLength={500} defaultValue={s.live_stream_url} className={input} /></Field>
            <p className="text-sm text-muted sm:col-span-2">Paste a YouTube video or live link (youtube.com/live/… or youtube.com/watch?v=…) and the Watch page embeds the player. Any other link just opens in a new tab.</p>
          </div>
          <div className={actions}><button className={btnPrimary}><Save size={16} aria-hidden="true" />Save settings</button></div>
        </Panel>
      </form>

      <Panel icon={Images} title="Site photos" description="Pictures used in fixed places around the site. Upload each once; replace it any time. JPG, PNG or WebP under 8 MB.">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {(Object.keys(PHOTO_SLOTS) as PhotoSlot[]).map((slot) => {
            const meta = PHOTO_SLOTS[slot];
            const url = s[`photo_${slot}_url`];
            return (
              <div key={slot} className="flex flex-col gap-3 rounded-xl border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-ink">{meta.label}</span>
                    <span className="text-[12.5px] text-muted">{meta.where}</span>
                  </div>
                  {url && (
                    <form action={removeSitePhoto.bind(null, slot)}>
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#8a8a92] hover:bg-paper-2 hover:text-accent" title="Remove" aria-label={`Remove ${meta.label}`}><Trash2 size={15} aria-hidden="true" /></button>
                    </form>
                  )}
                </div>
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="aspect-[16/10] w-full rounded-lg bg-paper-2 object-cover ring-1 ring-black/5" />
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center rounded-lg bg-paper-2 text-[12px] text-muted ring-1 ring-black/5">{meta.shape}</div>
                )}
                <form action={uploadSitePhoto.bind(null, slot)} className="flex flex-wrap items-center gap-2">
                  <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required aria-label={`Choose ${meta.label}`} className={`${input} min-w-0 flex-1`} />
                  <button className={btnPrimary}><Upload size={15} aria-hidden="true" />{url ? 'Replace' : 'Upload'}</button>
                </form>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel icon={Clapperboard} title="Homepage hero video" description="A short, silent clip that plays behind the headline on the homepage. The flyer panel stays on top of it. 10 to 20 seconds, landscape, MP4 (H.264) or WebM, under 80 MB; it loops on its own and is skipped for people who prefer reduced motion.">
        {s.hero_video_url ? (
          <div className="flex flex-wrap items-start gap-5">
            <video src={s.hero_video_url} muted loop autoPlay playsInline className="w-full max-w-[420px] rounded-xl bg-ink ring-1 ring-black/5" />
            <form action={removeHeroVideo} className="flex flex-col gap-2 text-[13px] text-muted">
              <span>Playing on the homepage now.</span>
              <button className={`${btnDanger} self-start`}><Trash2 size={16} aria-hidden="true" />Remove video</button>
            </form>
          </div>
        ) : (
          <p className="text-[13px] text-muted">No video yet. The homepage shows the plain dark hero until one is uploaded.</p>
        )}
        <form action={uploadHeroVideo} className={fields}>
          <Field id="video" label={s.hero_video_url ? 'Replace the video' : 'Upload a video'} hint="Tip: export at 1920 × 1080, 24 or 30 fps, no audio track, 4 to 8 Mbps. A phone clip exported through iMovie, CapCut or Handbrake works well." wide>
            <input id="video" name="video" type="file" accept="video/mp4,video/webm" required className={input} />
          </Field>
          <div className={actions}><button className={btnPrimary}><Upload size={16} aria-hidden="true" />Upload video</button></div>
        </form>
        {s.hero_video_url && (
          <form action={uploadHeroPoster} className={`${fields} border-t border-line pt-5`}>
            <Field id="poster" label={s.hero_video_poster_url ? 'Replace the poster frame' : 'Poster frame (recommended)'} hint="A still from the clip, shown the instant the page opens while the video loads. Take a screenshot of the video and upload it as JPG." wide>
              <div className="flex flex-wrap items-center gap-3">
                {s.hero_video_poster_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.hero_video_poster_url} alt="" className="h-16 w-28 rounded-md object-cover ring-1 ring-black/5" />
                )}
                <input id="poster" name="poster" type="file" accept="image/jpeg,image/png,image/webp" required className={`${input} min-w-0 flex-1`} />
                <button className={btnPrimary}><Upload size={16} aria-hidden="true" />{s.hero_video_poster_url ? 'Replace' : 'Upload'}</button>
              </div>
            </Field>
          </form>
        )}
      </Panel>
    </>
  );
}
