import { safeFetch } from './safefetch';

/** FRED (St. Louis Fed) public CSV download, no API key needed. Cached for one hour. */
const BASE = process.env.FRED_BASE || 'https://fred.stlouisfed.org';
export type Series = { id: string; label: string; unit: string; latest: number; prev: number; date: string; change: number; spark: number[] };
const SERIES: { id: string; label: string; unit: string; yoy?: boolean }[] = [
  { id: 'FEDFUNDS', label: 'Fed funds rate', unit: '%' }, { id: 'DGS3MO', label: '3-month Treasury', unit: '%' }, { id: 'DGS2', label: '2-year Treasury', unit: '%' },
  { id: 'DGS10', label: '10-year Treasury', unit: '%' }, { id: 'DGS30', label: '30-year Treasury', unit: '%' }, { id: 'T10Y2Y', label: '10y minus 2y spread', unit: ' pts' },
  { id: 'UNRATE', label: 'Unemployment rate', unit: '%' }, { id: 'CPIAUCSL', label: 'CPI inflation, year over year', unit: '%', yoy: true },
];
let cache: { at: number; rows: Series[] } | null = null;
async function one(s: (typeof SERIES)[number]): Promise<Series> {
  const r = await safeFetch(`${BASE}/graph/fredgraph.csv?id=${s.id}`, { headers: { 'user-agent': 'CashewGlobalMarkets/0.1' } }, 3_000_000);
  if (r.status >= 400) throw new Error(`${s.id}: FRED returned ${r.status}`);
  let pts = r.text.trim().split('\n').slice(1).map(l => l.split(',')).filter(c => c[1] && c[1] !== '.' && !isNaN(Number(c[1]))).map(c => ({ d: c[0], v: Number(c[1]) }));
  if (s.yoy) pts = pts.slice(12).map((p, i) => ({ d: p.d, v: (p.v / pts[i].v - 1) * 100 }));
  if (pts.length < 2) throw new Error(`${s.id}: no data`);
  const last = pts[pts.length - 1], prev = pts[pts.length - 2];
  return { id: s.id, label: s.label, unit: s.unit, latest: +last.v.toFixed(2), prev: +prev.v.toFixed(2), date: last.d, change: +(last.v - prev.v).toFixed(2), spark: pts.slice(-60).map(p => +p.v.toFixed(3)) };
}
export async function macro(): Promise<{ rows: Series[]; errors: string[] }> {
  if (cache && Date.now() - cache.at < 3_600_000) return { rows: cache.rows, errors: [] };
  const errors: string[] = []; const rows: Series[] = [];
  const res = await Promise.all(SERIES.map(s => one(s).catch((e: any) => { errors.push(e.message); return null; })));
  res.forEach(r => r && rows.push(r));
  if (rows.length) cache = { at: Date.now(), rows };
  return { rows, errors };
}
