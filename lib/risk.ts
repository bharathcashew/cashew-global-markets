export type RiskPos = { symbol: string; weight: number; value: number; vol: number; beta: number };
const ret = (p: number[]) => p.slice(1).map((x, i) => x / p[i] - 1);
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const cov = (a: number[], b: number[]) => { const ma = mean(a), mb = mean(b); return a.reduce((s, x, i) => s + (x - ma) * (b[i] - mb), 0) / (a.length - 1); };
const sd = (a: number[]) => Math.sqrt(cov(a, a));
export function risk(pos: { symbol: string; value: number }[], hist: Record<string, number[]>, bench: number[]) {
  const total = pos.reduce((s, p) => s + p.value, 0) || 1;
  const R = Object.fromEntries(Object.entries(hist).map(([k, v]) => [k, ret(v)])); const B = ret(bench);
  const rows: RiskPos[] = pos.map(p => ({ symbol: p.symbol, value: p.value, weight: p.value / total, vol: sd(R[p.symbol]) * Math.sqrt(252) * 100, beta: cov(R[p.symbol], B) / cov(B, B) }));
  const n = B.length; const port = Array.from({ length: n }, (_, i) => rows.reduce((s, r) => s + r.weight * R[r.symbol][i], 0));
  const corr = pos.map(a => pos.map(b => cov(R[a.symbol], R[b.symbol]) / (sd(R[a.symbol]) * sd(R[b.symbol]))));
  const dailyVol = sd(port);
  return {
    rows, symbols: pos.map(p => p.symbol), corr: corr.map(r => r.map(x => +x.toFixed(2))),
    portVol: +(dailyVol * Math.sqrt(252) * 100).toFixed(1), portBeta: +rows.reduce((s, r) => s + r.weight * r.beta, 0).toFixed(2),
    var95: Math.round(1.645 * dailyVol * total), top: rows.slice().sort((a, b) => b.weight - a.weight)[0]?.symbol ?? '',
    topWeight: +(Math.max(...rows.map(r => r.weight)) * 100).toFixed(1), hhi: +rows.reduce((s, r) => s + r.weight ** 2, 0).toFixed(3), days: n, total,
  };
}
