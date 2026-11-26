'use client';
import Shell from '@/components/Shell';
import { Card, Chg, SampleChip, Status, useApi } from '@/components/ui';
import { INDEXES } from '@/lib/universe';
import { useState } from 'react';

type Q = { symbol: string; price: number; pct: number };
const cls = (v: number) => (v >= 1 ? 'g2' : v >= 0.15 ? 'g1' : v <= -1 ? 'r2' : v <= -0.15 ? 'r1' : 'n0');
export default function Heatmap() {
  const [idx, setIdx] = useState<keyof typeof INDEXES>('SP500');
  const { data, error, loading } = useApi<{ quotes: Q[]; source: string }>(`/api/quotes?index=${idx}`);
  const by = Object.fromEntries((data?.quotes || []).map(q => [q.symbol, q]));
  return (
    <Shell title="Heatmap" sub={INDEXES[idx].label} chip={<SampleChip src={data?.source} />}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {Object.entries(INDEXES).map(([k, v]) => <button key={k} type="button" className={`tab${k === idx ? ' on' : ''}`} onClick={() => setIdx(k as keyof typeof INDEXES)}>{v.label.split(' (')[0]}</button>)}
      </div>
      <Status loading={loading} error={error} />
      <Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          {INDEXES[idx].sectors.map(s => (
            <div key={s.name} style={{ flex: '1 1 260px', minWidth: 200 }}>
              <div className="mu" style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{s.name.toUpperCase()}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(72px,1fr))', gap: 3 }}>
                {s.symbols.map(sym => { const q = by[sym]; return q ? <div key={sym} className={`tile ${cls(q.pct)}`} style={{ height: 56 }} aria-label={`${sym} ${q.pct.toFixed(2)} percent`}>{sym}<span>{q.pct >= 0 ? '+' : '-'}{Math.abs(q.pct).toFixed(2)}%</span></div> : null; })}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Shell>
  );
}
