import { XMLParser } from 'fast-xml-parser';
import { safeFetch } from './safefetch';

/**
 * SEC EDGAR Form 4 (insider transactions). Public data, free. The SEC asks every client to send a
 * User-Agent that identifies you with a contact email (SEC_USER_AGENT) and to stay under 10 requests
 * per second. Results are cached for 15 minutes so one page view costs at most ~2 requests per filing.
 */
const BASE = process.env.EDGAR_BASE || 'https://www.sec.gov';
const UA = () => process.env.SEC_USER_AGENT || 'CashewGlobalMarkets admin@example.com';
const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', processEntities: true });
export type Insider = { symbol: string; company: string; insider: string; role: string; side: 'BUY' | 'SELL'; shares: number; price: number | null; value: number | null; date: string; link: string };
export type Cluster = { symbol: string; company: string; insiders: number; shares: number; value: number };
let cache: { at: number; rows: Insider[] } | null = null;
const arr = <T,>(v: T | T[] | undefined): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
const val = (v: any): string => (v == null ? '' : typeof v === 'object' ? String(v.value ?? v['#text'] ?? '') : String(v));
const get = (url: string) => safeFetch(url, { headers: { 'user-agent': UA(), accept: 'application/xml, application/json, text/xml, */*' } }, 2_000_000);

async function listFilings(count: number) {
  const r = await get(`${BASE}/cgi-bin/browse-edgar?action=getcurrent&type=4&count=${count}&output=atom`);
  if (r.status >= 400) throw new Error(`SEC returned ${r.status}`);
  const feed = xml.parse(r.text)?.feed; const seen = new Set<string>(); const out: { cik: string; acc: string }[] = [];
  for (const e of arr<any>(feed?.entry)) {
    const href: string = arr<any>(e.link)[0]?.['@_href'] || '';
    const m = href.match(/\/data\/(\d+)\/(\d{18})\//); if (!m) continue;
    if (seen.has(m[2])) continue; seen.add(m[2]); out.push({ cik: m[1], acc: m[2] });
  }
  return out;
}
async function readFiling(cik: string, acc: string): Promise<Insider[]> {
  const dir = `${BASE}/Archives/edgar/data/${cik}/${acc}`;
  const idx = await get(`${dir}/index.json`); if (idx.status >= 400) return [];
  const items: { name: string }[] = JSON.parse(idx.text)?.directory?.item || [];
  const f = items.find(i => /\.xml$/i.test(i.name) && !/^(R\d|FilingSummary)/i.test(i.name) && !/xsl/i.test(i.name));
  if (!f) return [];
  const d = await get(`${dir}/${f.name}`); if (d.status >= 400) return [];
  const doc = xml.parse(d.text)?.ownershipDocument; if (!doc) return [];
  const symbol = val(doc.issuer?.issuerTradingSymbol).toUpperCase(); const company = val(doc.issuer?.issuerName);
  const owner = arr<any>(doc.reportingOwner)[0]; const rel = owner?.reportingOwnerRelationship || {};
  const role = val(rel.officerTitle) || (val(rel.isDirector) === '1' || val(rel.isDirector) === 'true' ? 'Director' : (val(rel.isTenPercentOwner) === '1' || val(rel.isTenPercentOwner) === 'true') ? '10% owner' : 'Insider');
  const rows: Insider[] = [];
  for (const t of arr<any>(doc.nonDerivativeTable?.nonDerivativeTransaction)) {
    const code = val(t.transactionCoding?.transactionCode);
    if (code !== 'P' && code !== 'S') continue; // open-market purchase or sale only
    const shares = Number(val(t.transactionAmounts?.transactionShares)); const price = Number(val(t.transactionAmounts?.transactionPricePerShare)) || null;
    if (!symbol || !(shares > 0)) continue;
    rows.push({ symbol, company, insider: val(owner?.reportingOwnerId?.rptOwnerName), role, side: code === 'P' ? 'BUY' : 'SELL', shares, price, value: price ? Math.round(shares * price) : null, date: val(t.transactionDate), link: `${BASE}/Archives/edgar/data/${cik}/${acc}/` });
  }
  return rows;
}
export async function recentInsiders(): Promise<Insider[]> {
  if (cache && Date.now() - cache.at < 900_000) return cache.rows;
  const filings = (await listFilings(60)).slice(0, 40); const rows: Insider[] = [];
  for (let i = 0; i < filings.length; i += 4) { // small batches keep us well under the SEC rate limit
    const got = await Promise.all(filings.slice(i, i + 4).map(f => readFiling(f.cik, f.acc).catch(() => [] as Insider[])));
    got.forEach(g => rows.push(...g));
  }
  rows.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  cache = { at: Date.now(), rows }; return rows;
}
/** Two or more different insiders buying the same company in the window. */
export function clusters(rows: Insider[]): Cluster[] {
  const m = new Map<string, { c: Cluster; who: Set<string> }>();
  for (const r of rows.filter(r => r.side === 'BUY')) {
    const e = m.get(r.symbol) || { c: { symbol: r.symbol, company: r.company, insiders: 0, shares: 0, value: 0 }, who: new Set<string>() };
    e.who.add(r.insider); e.c.shares += r.shares; e.c.value += r.value ?? 0; e.c.insiders = e.who.size; m.set(r.symbol, e);
  }
  return [...m.values()].map(e => e.c).filter(c => c.insiders >= 2).sort((a, b) => b.insiders - a.insiders || b.value - a.value);
}
