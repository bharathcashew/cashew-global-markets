import { XMLParser } from 'fast-xml-parser';
import { safeFetch } from './safefetch';
export type Headline = { title: string; link: string; source: string; date: string | null };
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', processEntities: true });
const cache = new Map<string, { at: number; items: Headline[] }>();
const text = (v: any): string => (typeof v === 'string' ? v : v?.['#text'] ? String(v['#text']) : '');
const clean = (s: string) => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 300);
export async function fetchFeed(url: string, source: string): Promise<Headline[]> {
  const hit = cache.get(url); if (hit && Date.now() - hit.at < 300_000) return hit.items;
  const r = await safeFetch(url, { headers: { accept: 'application/rss+xml, application/atom+xml, text/xml, */*', 'user-agent': 'CashewGlobalMarkets/0.1' } });
  if (r.status >= 400) throw new Error(`Feed returned ${r.status}`);
  const x = parser.parse(r.text); const out: Headline[] = [];
  const rssItems = [x?.rss?.channel?.item].flat().filter(Boolean); const atom = [x?.feed?.entry].flat().filter(Boolean);
  for (const it of rssItems) out.push({ title: clean(text(it.title)), link: text(it.link), source, date: text(it.pubDate) || null });
  for (const it of atom) { const l = [it.link].flat()[0]; out.push({ title: clean(text(it.title)), link: l?.['@_href'] || text(l), source, date: text(it.updated) || text(it.published) || null }); }
  const items = out.filter(i => i.title && /^https?:\/\//.test(i.link)).slice(0, 30);
  if (!items.length && !rssItems.length && !atom.length) throw new Error('Not a valid RSS or Atom feed');
  cache.set(url, { at: Date.now(), items }); return items;
}
