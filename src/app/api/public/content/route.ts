import { NextRequest, NextResponse } from 'next/server';
import { getSettings, getUpcomingEvents, getRecentMessages, getServices, getHeroPanels, getAnnouncement, getMinistries, getLeaders } from '@/lib/content';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  if (process.env.BACKEND_ORIGIN) return NextResponse.json({ error: 'Backend only' }, { status: 404 });
  const resource = request.nextUrl.searchParams.get('resource');
  const raw = Number(request.nextUrl.searchParams.get('limit') ?? 50);
  const limit = Number.isFinite(raw) ? Math.min(100, Math.max(1, Math.floor(raw))) : 50;
  let data: unknown;
  switch (resource) {
    case 'settings': data = Object.fromEntries(Object.entries(await getSettings()).filter(([key]) => !key.endsWith('_key') && !key.startsWith('youtube_'))); break;
    case 'events': data = await getUpcomingEvents(limit); break;
    case 'messages': data = await getRecentMessages(limit); break;
    case 'services': data = await getServices(); break;
    case 'heroPanels': data = await getHeroPanels(); break;
    case 'announcement': data = await getAnnouncement(); break;
    case 'ministries': data = await getMinistries(); break;
    case 'leaders': data = (await getLeaders()).map(({cutout_url, cutout_key, ...row}) => row); break;
    default: return NextResponse.json({ error: 'Unknown resource' }, { status: 400 });
  }
  // Storage object keys are internal; URLs are the public interface.
  return new NextResponse(JSON.stringify(data, (key, value) => key.endsWith('_key') ? undefined : value), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
