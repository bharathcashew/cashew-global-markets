'use client';
import Shell from '@/components/Shell';
import { Card, Chg, Kpi, Kpis, SampleChip, Status, Table, post, useApi } from '@/components/ui';
import { fmtMoney } from '@/lib/calc';
import { useState } from 'react';

type Pos = { symbol: string; shares: number; cost: number };
export default function Portfolio() {
  const pos = useApi<{ positions: Pos[] }>('/api/portfolio');
  const list = pos.data?.positions || [];
  const syms = list.map(p => p.symbol).join(',');
  const q = useApi<{ quotes: { symbol: string; price: number; change: number }[]; source: string }>(syms ? `/api/quotes?symbols=${syms}` : null, [syms]);
  const px = Object.fromEntries((q.data?.quotes || []).map(x => [x.symbol, x]));
  const [f, setF] = useState({ symbol: '', shares: '', cost: '' }); const [err, setErr] = useState('');
  const save = async (next: Pos[]) => { try { await post('/api/portfolio', { positions: next }); pos.reload(); setErr(''); } catch (e: any) { setErr(e.message); } };
  let value = 0, cost = 0, day = 0;
  const rows = list.map(p => { const x = px[p.symbol]; const price = x?.price ?? p.cost; const v = price * p.shares, c = p.cost * p.shares; value += v; cost += c; day += (x?.change ?? 0) * p.shares; return [<b key="s">{p.symbol}</b>, p.shares, fmtMoney(p.cost), fmtMoney(price), fmtMoney(v), <Chg key="p" v={v - c} money />, <Chg key="r" v={c ? ((v - c) / c) * 100 : 0} />, <button key="x" className="btn" onClick={() => save(list.filter(l => l.symbol !== p.symbol))}>Remove</button>]; });
  return (
    <Shell title="Portfolio" sub="Your positions" chip={<SampleChip src={q.data?.source ?? 'sample'} />}>
      <Kpis><Kpi l="Total value">{fmtMoney(value)}</Kpi><Kpi l="Cost basis">{fmtMoney(cost)}</Kpi><Kpi l="Total P&L"><Chg v={value - cost} money /></Kpi><Kpi l="Return"><Chg v={cost ? ((value - cost) / cost) * 100 : 0} /></Kpi><Kpi l="Day P&L"><Chg v={day} money /></Kpi></Kpis>
      <Status loading={pos.loading} error={pos.error} />
      <Card title={`Positions · ${list.length}`}>
        {list.length ? <Table cols="1fr 80px 1fr 1fr 1fr 1fr 1fr 100px" heads={['Symbol', 'Qty', 'Avg cost', 'Price', 'Value', 'P&L', 'Return', '']} rows={rows} right={[1, 2, 3, 4, 5, 6]} /> : <p className="mu">No positions yet. Add one below.</p>}
        <form style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }} onSubmit={e => { e.preventDefault(); const s = f.symbol.toUpperCase().trim(); if (!s) return; save([...list.filter(l => l.symbol !== s), { symbol: s, shares: Number(f.shares), cost: Number(f.cost) }]); setF({ symbol: '', shares: '', cost: '' }); }}>
          <input className="in" aria-label="Symbol" placeholder="Symbol" value={f.symbol} onChange={e => setF({ ...f, symbol: e.target.value })} />
          <input className="in" aria-label="Shares" placeholder="Shares" inputMode="decimal" value={f.shares} onChange={e => setF({ ...f, shares: e.target.value })} />
          <input className="in" aria-label="Average cost" placeholder="Average cost" inputMode="decimal" value={f.cost} onChange={e => setF({ ...f, cost: e.target.value })} />
          <button className="btn p" type="submit">Add position</button>
        </form>
        {err && <p className="dn" role="alert">{err}</p>}
      </Card>
    </Shell>
  );
}
