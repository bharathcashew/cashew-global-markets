'use client';
import Shell from '@/components/Shell';
import { Card, Chg, Kpi, Kpis, SampleChip, Status, useApi } from '@/components/ui';
type V = { vix: number; vix3m: number; vvix: number; skew: number; rv20: number; est6m: number; vrp: number; contango: boolean; spx: number; callWall: number; gammaFlip: number; putWall: number; aboveFlip: boolean; source: string };
export default function Vol() {
  const { data: v, error, loading } = useApi<V>('/api/vix');
  const row = (a: string, b: string | number) => <div key={a} style={{ display: 'flex', justifyContent: 'space-between', minHeight: 40, alignItems: 'center', borderTop: '1px solid var(--line)' }}><span>{a}</span><b className="num">{b}</b></div>;
  return (
    <Shell title="Volatility" sub="Implied, realized and dealer positioning" chip={<SampleChip src={v?.source} />}>
      <Status loading={loading} error={error} />
      {v && <>
        <Kpis><Kpi l="VIX">{v.vix}</Kpi><Kpi l="VIX3M">{v.vix3m}</Kpi><Kpi l="VVIX">{v.vvix}</Kpi><Kpi l="SKEW">{v.skew}</Kpi><Kpi l="20D realized">{v.rv20}</Kpi><Kpi l="VRP"><Chg v={v.vrp} d={1} suf="" /></Kpi></Kpis>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: '1 1 360px' }}><Card title="Term structure">{[['VIX', v.vix], ['VIX3M', v.vix3m], ['Est. 6M', v.est6m]].map(([n, x]) => <div key={n as string} style={{ display: 'grid', gridTemplateColumns: '80px minmax(0,1fr) 50px', gap: 12, alignItems: 'center', minHeight: 36 }}><span>{n}</span><div className="bar"><div style={{ height: 8, borderRadius: 4, background: 'var(--ac)', width: `${((x as number) / v.est6m) * 100}%` }} /></div><span className="r num">{x}</span></div>)}<p style={{ marginTop: 12 }}><b>{v.contango ? 'Contango' : 'Backwardation'}</b></p></Card></div>
          <div style={{ flex: '1 1 360px' }}><Card title="SPX gamma levels">{[row('Call wall', v.callWall), row('Spot', v.spx), row('Gamma flip', v.gammaFlip), row('Put wall', v.putWall)]}<p className="mu" style={{ marginTop: 12, fontSize: 13 }}>Spot is {v.aboveFlip ? 'above' : 'below'} the gamma flip, a {v.aboveFlip ? 'positive' : 'negative'}-gamma setting.</p></Card></div>
        </div>
      </>}
    </Shell>
  );
}
