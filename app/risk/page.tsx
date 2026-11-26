'use client';
import Shell from '@/components/Shell';
import { Card, Kpi, Kpis, SampleChip, Status, Table, useApi } from '@/components/ui';
import { fmtMoney } from '@/lib/calc';
type D = { empty?: boolean; rows: { symbol: string; weight: number; value: number; vol: number; beta: number }[]; symbols: string[]; corr: number[][]; portVol: number; portBeta: number; var95: number; top: string; topWeight: number; hhi: number; days: number; total: number; source: string };
const cc = (v: number, i: number, j: number) => i === j ? 'var(--chip)' : `color-mix(in srgb, ${v >= 0 ? 'var(--c)' : 'var(--dn)'} ${Math.round(Math.abs(v) * 55)}%, transparent)`;
export default function Risk() {
  const { data: d, error, loading } = useApi<D>('/api/risk');
  return (
    <Shell title="Risk" sub="Volatility, beta, concentration and correlation of your portfolio" chip={<SampleChip src={d?.source} />}>
      <Status loading={loading} error={error} />
      {d?.empty && <Card><p className="mu">Add at least two positions on the Portfolio page to see risk.</p></Card>}
      {d && !d.empty && <>
        <Kpis><Kpi l="Portfolio value">{fmtMoney(d.total)}</Kpi><Kpi l="Annual volatility">{d.portVol}%</Kpi><Kpi l="Beta vs SPY">{d.portBeta}</Kpi><Kpi l="1-day 95% loss">{fmtMoney(d.var95)}</Kpi><Kpi l="Largest position">{d.top} {d.topWeight}%</Kpi></Kpis>
        <Card title="Positions"><Table cols="1fr 1fr 1fr 1fr 1fr" heads={['Symbol', 'Weight', 'Value', 'Volatility', 'Beta']} right={[1, 2, 3, 4]} rows={d.rows.map(r => [<b key="s">{r.symbol}</b>, `${(r.weight * 100).toFixed(1)}%`, fmtMoney(r.value), `${r.vol.toFixed(1)}%`, r.beta.toFixed(2)])} /></Card>
        <Card title="Correlation">
          <div className="tbl"><table style={{ borderCollapse: 'separate', borderSpacing: 3, minWidth: 320 }}><thead><tr><th />{d.symbols.map(s => <th key={s} className="mu" style={{ fontSize: 12, fontWeight: 500 }}>{s}</th>)}</tr></thead>
            <tbody>{d.symbols.map((a, i) => <tr key={a}><th className="mu" style={{ fontSize: 12, fontWeight: 500, textAlign: 'right', paddingRight: 8 }}>{a}</th>{d.corr[i].map((v, j) => <td key={j} className="num" style={{ background: cc(v, i, j), textAlign: 'center', borderRadius: 6, minWidth: 64, height: 40 }}>{v.toFixed(2)}</td>)}</tr>)}</tbody></table></div>
          <p className="mu" style={{ marginTop: 12, fontSize: 13 }}>Close to 1 means two positions move together, so they add little diversification.</p>
        </Card>
        <p className="mu" style={{ fontSize: 13 }}>Based on {d.days} days of daily prices. The 1-day loss is a simple statistical estimate that assumes normal returns. It understates real tail risk and is not a forecast. Not investment advice.</p>
      </>}
    </Shell>
  );
}
