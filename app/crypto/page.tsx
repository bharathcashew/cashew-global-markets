'use client';
import Shell from '@/components/Shell';
import { Card, Chg, Kpi, Kpis, SampleChip, Status, Table, useApi } from '@/components/ui';
type C = { symbol: string; price: number; pct: number; marketCap: number; volume: number; dayHigh: number; dayLow: number; low52: number; high52: number };
const big = (n: number) => (n >= 1e12 ? (n / 1e12).toFixed(2) + 'T' : n >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : (n / 1e6).toFixed(2) + 'M');
export default function Crypto() {
  const { data, error, loading } = useApi<{ coins: C[]; source: string }>('/api/crypto');
  const c = data?.coins || []; const cap = c.reduce((a, b) => a + b.marketCap, 0);
  return (
    <Shell title="Crypto" sub="Top coins" chip={<SampleChip src={data?.source} />}>
      <Kpis><Kpi l="Market cap (shown)">${big(cap)}</Kpi><Kpi l="Gainers">{c.filter(x => x.pct > 0).length}</Kpi><Kpi l="Losers">{c.filter(x => x.pct < 0).length}</Kpi></Kpis>
      <Status loading={loading} error={error} />
      <Card title="Coins"><Table cols="70px 1fr 1fr 1fr 1fr 1.6fr" heads={['Coin', 'Price', '24h', 'Market cap', 'Volume', '52-week range']} right={[1, 2, 3, 4]}
        rows={c.map(x => { const p = Math.max(0, Math.min(100, ((x.price - x.low52) / (x.high52 - x.low52)) * 100)); return [<b key="s">{x.symbol}</b>, '$' + x.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), <Chg key="c" v={x.pct} />, big(x.marketCap), big(x.volume), <div key="r"><div style={{ position: 'relative', height: 8, background: 'var(--line)', borderRadius: 4 }}><div style={{ position: 'absolute', left: `${p}%`, top: -2, width: 12, height: 12, borderRadius: '50%', background: 'var(--ac)', transform: 'translateX(-50%)' }} /></div><div className="mu" style={{ fontSize: 11, marginTop: 6 }}>{x.low52.toLocaleString('en-US', { maximumFractionDigits: 2 })} to {x.high52.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div></div>]; })} /></Card>
    </Shell>
  );
}
