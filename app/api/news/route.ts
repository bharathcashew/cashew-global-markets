import { guard } from '@/lib/auth';
import { store } from '@/lib/store';
import { fetchFeed, type Headline } from '@/lib/rss';
export const GET = guard(async (u) => {
  const feeds = await store.listConns(u, 'rss'); const errors: string[] = []; let all: Headline[] = [];
  await Promise.all(feeds.map(async f => { try { all = all.concat(await fetchFeed(f.url!, f.name)); } catch (e: any) { errors.push(`${f.name}: ${e.message}`); } }));
  all.sort((a, b) => (Date.parse(b.date || '') || 0) - (Date.parse(a.date || '') || 0));
  return Response.json({ headlines: all.slice(0, 60), errors, sources: feeds.length });
});
