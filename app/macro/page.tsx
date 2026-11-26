'use client';
import Shell from '@/components/Shell';
import { Card, Kpi, Kpis, Status, useApi } from '@/components/ui';
type S = { id: string; label: string; unit: string; latest: number; prev: number; date: string; change: number; spark: number[] };
function Spark({ v, c }: { v: number[]; c: string }) {
  const mn = Math.min(...v), mx = Math.max(...v), r = mx - mn || 1;
  const pts = v.map((x, i) => `${(i / (v.length - 1)) * 200},${46 - ((x - mn) / r) * 40}`).join(' ');
  return <svg viewBox="0 0 200 50" width="100%" height="50" role="img" aria-label="Recent trend" preserveAspectRatio="none"><polyline points={pts} fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /></svg>;
}
export default function Macro() {
  const { data, error, loading } = useApi<{ rows: S[]; errors: string[] }>('/api/macro');
  const by = Object.fromEntries((data?.rows || []).map(r => [r.id, r]));
  const curve = ['DGS3MO', 'DGS2', 'DGS10', 'DGS30'].map(k => by[k]).filter(Boolean) as S[];
  const spread = by.T10Y2Y; const inverted = spread ? spread.latest < 0 : null;
  const hi = Math.max(...curve.map(c => c.latest)), lo = Math.min(...curve.map(c => c.latest)) - 0.4, h = (v: number) => 24 + ((v - lo) / (hi - lo || 1)) * 76;
  return (
    <Shell title="Macro" sub="Rates, yield curve, inflation and jobs from the St. Louis Fed" chip={<span className="chip">FRED</span>}>
      <Status loading={loading} error={error} />
      {data?.errors?.length ? <p className="dn" role="alert">Some series failed to load: {data.errors.join('; ')}</p> : null}
      {data && <>
        <Kpis>{['FEDFUNDS', 'DGS10', 'T10Y2Y', 'UNRATE', 'CPIAUCSL'].map(k => by[k] && <Kpi key={k} l={by[k].label}>{by[k].latest.toFixed(2)}{by[k].unit}</Kpi>)}</Kpis>
        {curve.length > 1 && <Card title="Treasury yield curve (bars start at a zoomed baseline)" extra={inverted == null ? null : <span className="chip" style={{ color: inverted ? 'var(--dn)' : 'var(--up)' }}>{inverted ? 'Inverted (10y below 2y)' : 'Normal (10y above 2y)'}</span>}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, height: 150, padding: '8px 8px 0' }}>
            {curve.map(c => <div key={c.id} style={{ flex: 1, textAlign: 'center' }}><b className="num">{c.latest.toFixed(2)}%</b><div style={{ height: h(c.latest), background: 'var(--c)', borderRadius: '6px 6px 0 0', marginTop: 4, minHeight: 4 }} /></div>)}
          </div>
          <div style={{ display: 'flex', gap: 24, padding: '6px 8px 0' }}>{['3 month', '2 year', '10 year', '30 year'].slice(0, curve.length).map(l => <span key={l} className="mu" style={{ flex: 1, textAlign: 'center', fontSize: 12 }}>{l}</span>)}</div>
        </Card>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
          {data.rows.map(r => <Card key={r.id} title={r.label}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}><b className="num" style={{ fontSize: 24 }}>{r.latest.toFixed(2)}{r.unit}</b><span className={`num ${r.change >= 0 ? 'up' : 'dn'}`}>{r.change >= 0 ? '+' : '-'}{Math.abs(r.change).toFixed(2)}</span></div>
            <Spark v={r.spark} c="var(--c)" /><div className="mu" style={{ fontSize: 12 }}>As of {r.date}</div>
          </Card>)}
        </div>
        <p className="mu" style={{ fontSize: 13 }}>Source: Federal Reserve Bank of St. Louis (FRED). Monthly series such as unemployment and inflation update once a month. An economic calendar is not included.</p>
      </>}
    </Shell>
  );
}
