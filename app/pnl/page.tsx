'use client';
import Shell from '@/components/Shell';
import { Card, Chg, Kpi, Kpis, Status, post, useApi } from '@/components/ui';
import { useState } from 'react';

export default function Pnl() {
  const { data, error, loading, reload } = useApi<{ pnl: Record<string, { amount: number; notes: string }> }>('/api/pnl');
  const [ym, setYm] = useState(() => new Date().toISOString().slice(0, 7));
  const [sel, setSel] = useState<string | null>(null); const [amt, setAmt] = useState('');
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const pnl = data?.pnl || {}; const keys = Object.keys(pnl).filter(k => k.startsWith(ym));
  const vals = keys.map(k => pnl[k].amount); const total = vals.reduce((a, b) => a + b, 0);
  const wins = vals.filter(v => v > 0).length, losses = vals.filter(v => v < 0).length;
  const best = keys.reduce<string | null>((a, k) => (!a || pnl[k].amount > pnl[a].amount ? k : a), null), worst = keys.reduce<string | null>((a, k) => (!a || pnl[k].amount < pnl[a].amount ? k : a), null);
  const shift = (d: number) => { const dt = new Date(Date.UTC(y, m - 1 + d, 1)); setYm(dt.toISOString().slice(0, 7)); setSel(null); };
  const save = async () => { if (!sel) return; await post('/api/pnl', { pnl: { [sel]: { amount: Number(amt), notes: '' } } }); setSel(null); setAmt(''); reload(); };
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(<div key={'b' + i} />);
  for (let d = 1; d <= dim; d++) {
    const k = `${ym}-${String(d).padStart(2, '0')}`; const v = pnl[k]?.amount;
    cells.push(<button key={k} type="button" className="cell" style={{ background: 'transparent', color: 'var(--ink)', textAlign: 'left', borderLeft: v == null ? undefined : `3px solid var(--${v >= 0 ? 'up' : 'dn'})`, outline: sel === k ? '2px solid var(--ac)' : undefined, cursor: 'pointer' }} onClick={() => { setSel(k); setAmt(v == null ? '' : String(v)); }} aria-label={`${k}${v == null ? '' : ' ' + v}`}><span className="mu">{d}</span>{v != null && <Chg v={v} money d={0} />}</button>);
  }
  return (
    <Shell title="P&L tracker" sub="Daily realized P&L">
      <Kpis><Kpi l="Month P&L"><Chg v={total} money d={0} /></Kpi><Kpi l="Win days">{wins}</Kpi><Kpi l="Loss days">{losses}</Kpi><Kpi l="Win rate">{vals.length ? ((wins / vals.length) * 100).toFixed(1) : '0.0'}%</Kpi><Kpi l="Best day">{best ? <Chg v={pnl[best].amount} money d={0} /> : 'n/a'}</Kpi><Kpi l="Worst day">{worst ? <Chg v={pnl[worst].amount} money d={0} /> : 'n/a'}</Kpi></Kpis>
      <Status loading={loading} error={error} />
      <Card title={new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })} extra={<span style={{ display: 'flex', gap: 8 }}><button className="btn" onClick={() => shift(-1)}>Previous</button><button className="btn" onClick={() => shift(1)}>Next</button></span>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 6 }}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="mu" style={{ fontSize: 12, textAlign: 'center' }}>{d}</div>)}{cells}</div>
        {sel && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, alignItems: 'center' }}><b>{sel}</b><input className="in" aria-label="P&L amount" inputMode="decimal" placeholder="Amount, e.g. 250 or -80" value={amt} onChange={e => setAmt(e.target.value)} /><button className="btn p" onClick={save}>Save</button></div>}
      </Card>
    </Shell>
  );
}
