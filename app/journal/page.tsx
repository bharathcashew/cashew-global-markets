'use client';
import Shell from '@/components/Shell';
import { Card, Chg, Kpi, Kpis, Status, Table, post, useApi } from '@/components/ui';
import { useState } from 'react';

type T = { id: number; symbol: string; side: string; quantity: number; entry_price: number; exit_price: number | null; stop_loss: number | null; status: string; pnl: number | null; r_multiple: number | null; entry_date: string };
type S = { total_pnl: number; win_rate: number; total_trades: number; open_trades: number; avg_r: number | null; best_trade: { symbol: string; pnl: number } | null; worst_trade: { symbol: string; pnl: number } | null };
const empty = { symbol: '', side: 'LONG', quantity: '', entry_price: '', exit_price: '', stop_loss: '', setup: '', notes: '' };
export default function Journal() {
  const t = useApi<{ trades: T[] }>('/api/trades'); const s = useApi<S>('/api/trades/stats', [t.data]);
  const [f, setF] = useState(empty); const [err, setErr] = useState(''); const [ai, setAi] = useState(''); const [busy, setBusy] = useState(false);
  const add = async (e: React.FormEvent) => { e.preventDefault(); try { await post('/api/trades', f); setF(empty); setErr(''); t.reload(); } catch (x: any) { setErr(x.message); } };
  const del = async (id: number) => { await fetch(`/api/trades/${id}`, { method: 'DELETE' }); t.reload(); };
  const analyze = async (body: object) => { setBusy(true); setAi(''); try { setAi((await post('/api/ai/analyze', body)).analysis); } catch (x: any) { setAi(x.message); } setBusy(false); };
  const st = s.data; const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Shell title="Trade journal" sub="Log trades, risk and lessons">
      <Kpis><Kpi l="Total P&L"><Chg v={st?.total_pnl ?? 0} money d={0} /></Kpi><Kpi l="Win rate">{(st?.win_rate ?? 0).toFixed(1)}%</Kpi><Kpi l="Trades">{st?.total_trades ?? 0}</Kpi><Kpi l="Open">{st?.open_trades ?? 0}</Kpi><Kpi l="Average R">{st?.avg_r == null ? 'n/a' : st.avg_r.toFixed(2) + 'R'}</Kpi></Kpis>
      <Status loading={t.loading} error={t.error} />
      <Card title="Trades" extra={<button className="btn" disabled={busy} onClick={() => analyze({ mode: 'journal' })}>AI review of journal</button>}>
        {t.data?.trades.length ? <Table cols="1fr 80px 70px 1fr 1fr 1fr 1fr 80px 140px" heads={['Symbol', 'Side', 'Qty', 'Entry', 'Exit', 'Stop', 'P&L', 'R', '']} right={[2, 3, 4, 5, 6, 7]}
          rows={t.data.trades.map(x => [<b key="s">{x.symbol}</b>, x.side, x.quantity, x.entry_price, x.exit_price ?? 'Open', x.stop_loss ?? '-', x.pnl == null ? '-' : <Chg key="p" v={x.pnl} money d={0} />, x.r_multiple == null ? '-' : x.r_multiple.toFixed(2) + 'R',
            <span key="a" style={{ display: 'flex', gap: 6 }}><button className="btn" disabled={busy} onClick={() => analyze({ mode: 'trade', tradeId: x.id })}>AI</button><button className="btn" onClick={() => del(x.id)}>Delete</button></span>])} /> : <p className="mu">No trades yet.</p>}
        {ai && <p style={{ marginTop: 16, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{ai}</p>}
      </Card>
      <Card title="Add trade">
        <form onSubmit={add} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
          <input className="in" aria-label="Symbol" placeholder="Symbol" value={f.symbol} onChange={set('symbol')} />
          <select className="in" aria-label="Side" value={f.side} onChange={set('side')}><option>LONG</option><option>SHORT</option></select>
          <input className="in" aria-label="Quantity" placeholder="Quantity" value={f.quantity} onChange={set('quantity')} />
          <input className="in" aria-label="Entry price" placeholder="Entry price" value={f.entry_price} onChange={set('entry_price')} />
          <input className="in" aria-label="Exit price" placeholder="Exit price" value={f.exit_price} onChange={set('exit_price')} />
          <input className="in" aria-label="Stop loss" placeholder="Stop loss" value={f.stop_loss} onChange={set('stop_loss')} />
          <input className="in" aria-label="Setup" placeholder="Setup" value={f.setup} onChange={set('setup')} />
          <button className="btn p" type="submit">Add trade</button>
        </form>
        {err && <p className="dn" role="alert">{err}</p>}
      </Card>
    </Shell>
  );
}
