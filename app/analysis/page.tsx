'use client';
import Shell from '@/components/Shell';
import { Card, Chg, SampleChip, Status, post, useApi } from '@/components/ui';
import { INDEXES } from '@/lib/universe';
import { useState } from 'react';
type Q = { symbol: string; pct: number };
export default function Analysis() {
  const { data, error, loading } = useApi<{ quotes: Q[]; source: string }>('/api/quotes?index=SP500');
  const [txt, setTxt] = useState(''); const [busy, setBusy] = useState(false);
  const by = Object.fromEntries((data?.quotes || []).map(q => [q.symbol, q.pct]));
  const sectors = INDEXES.SP500.sectors.map(s => { const v = s.symbols.map(x => by[x]).filter(x => x != null); return { name: s.name, avg: v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0 }; }).sort((a, b) => b.avg - a.avg);
  const all = [...(data?.quotes || [])].sort((a, b) => b.pct - a.pct);
  const adv = all.filter(q => q.pct > 0.05).length, dec = all.filter(q => q.pct < -0.05).length, flat = all.length - adv - dec;
  const max = Math.max(0.01, ...sectors.map(s => Math.abs(s.avg)));
  const gen = async () => { setBusy(true); setTxt(''); try { setTxt((await post('/api/ai/market', { index: 'S&P 500 sample subset', breadth: { advancing: adv, declining: dec, flat }, sectors, movers: { gainers: all.slice(0, 5).map(q => ({ symbol: q.symbol, pct: q.pct })), losers: all.slice(-5).reverse().map(q => ({ symbol: q.symbol, pct: q.pct })) } })).commentary); } catch (e: any) { setTxt(e.message); } setBusy(false); };
  const mv = (l: Q[]) => l.map(q => <div key={q.symbol} style={{ display: 'flex', justifyContent: 'space-between', minHeight: 40, alignItems: 'center', borderTop: '1px solid var(--line)' }}><b>{q.symbol}</b><Chg v={q.pct} /></div>);
  return (
    <Shell title="Market analysis" sub="Breadth, sectors and movers (sample subset)" chip={<SampleChip src={data?.source} />}>
      <Status loading={loading} error={error} />
      <Card title="Breadth"><div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden' }}><div className="bu" style={{ flex: adv }} /><div style={{ flex: flat, background: 'var(--mute)' }} /><div className="bd" style={{ flex: dec }} /></div><div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 12 }}><span className="up ua">{adv} advancing</span><span className="mu">{flat} flat</span><span className="dn da">{dec} declining</span></div></Card>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: '3 1 460px' }}><Card title="Sectors">{sectors.map(s => <div key={s.name} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,190px) minmax(0,1fr) 96px', gap: 12, alignItems: 'center', minHeight: 36 }}><span style={{ color: 'var(--sub)' }}>{s.name}</span><div className="bar"><div className={s.avg >= 0 ? 'bu' : 'bd'} style={{ height: 8, borderRadius: 4, width: `${(Math.abs(s.avg) / max) * 100}%` }} /></div><span className="r"><Chg v={s.avg} /></span></div>)}</Card></div>
        <div style={{ flex: '2 1 300px' }}><Card title="Top movers"><h3 style={{ fontSize: 13, marginBottom: 4 }}>Gainers</h3>{mv(all.slice(0, 5))}<h3 style={{ fontSize: 13, margin: '16px 0 4px' }}>Losers</h3>{mv(all.slice(-5).reverse())}</Card></div>
      </div>
      <Card title="AI commentary"><button className="btn" style={{ background: 'var(--ai)', color: '#fff', border: 0, fontWeight: 600 }} disabled={busy || !all.length} onClick={gen}>{busy ? 'Writing…' : 'Generate AI commentary'}</button>{txt && <p style={{ marginTop: 16, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{txt}</p>}</Card>
    </Shell>
  );
}
