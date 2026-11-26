'use client';
import Shell from '@/components/Shell';
import { Card, Kpi, Kpis, Status, Table, useApi } from '@/components/ui';
type R = { symbol: string; company: string; insider: string; role: string; side: 'BUY' | 'SELL'; shares: number; price: number | null; value: number | null; date: string; link: string };
type C = { symbol: string; company: string; insiders: number; shares: number; value: number };
const big = (v: number | null) => (v == null ? '-' : v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${Math.round(v).toLocaleString('en-US')}`);
export default function Insiders() {
  const { data, error, loading } = useApi<{ rows: R[]; clusters: C[] }>('/api/insiders');
  const rows = data?.rows || []; const buys = rows.filter(r => r.side === 'BUY'), sells = rows.filter(r => r.side === 'SELL');
  const sum = (a: R[]) => a.reduce((s, r) => s + (r.value ?? 0), 0);
  return (
    <Shell title="Insider tape" sub="Open-market purchases and sales by company insiders, from the latest SEC Form 4 filings" chip={<span className="chip">SEC EDGAR</span>}>
      <Status loading={loading} error={error} />
      {data && <>
        <Kpis><Kpi l="Insider buys">{buys.length}</Kpi><Kpi l="Buy value">{big(sum(buys))}</Kpi><Kpi l="Insider sells">{sells.length}</Kpi><Kpi l="Sell value">{big(sum(sells))}</Kpi><Kpi l="Cluster buys">{data.clusters.length}</Kpi></Kpis>
        <Card title="Cluster buys">
          {data.clusters.length ? <Table cols="90px minmax(0,2fr) 100px 1fr 1fr" heads={['Symbol', 'Company', 'Insiders', 'Shares', 'Value']} right={[2, 3, 4]} rows={data.clusters.map(c => [<b key="s">{c.symbol}</b>, c.company, c.insiders, c.shares.toLocaleString('en-US'), big(c.value)])} /> : <p className="mu">No company has two or more insiders buying in the current set of filings.</p>}
        </Card>
        <Card title="Latest transactions">
          {rows.length ? <Table cols="80px minmax(0,1.6fr) minmax(0,1.4fr) minmax(0,1.1fr) 70px 1fr 1fr 100px" heads={['Symbol', 'Company', 'Insider', 'Role', 'Side', 'Shares', 'Value', 'Date']} right={[5, 6]}
            rows={rows.map(r => [<a key="s" href={r.link} target="_blank" rel="noreferrer noopener"><b>{r.symbol}</b></a>, r.company, r.insider, r.role, <b key="d" className={r.side === 'BUY' ? 'up' : 'dn'}>{r.side === 'BUY' ? 'Buy' : 'Sell'}</b>, r.shares.toLocaleString('en-US'), big(r.value), r.date])} /> : <p className="mu">No open-market buys or sells in the latest filings.</p>}
        </Card>
        <p className="mu" style={{ fontSize: 13 }}>Shows only open-market purchases and sales (Form 4 codes P and S). Grants, option exercises and tax withholding are left out. This is the most recent batch of filings, not a full history. Sales are often planned in advance, so a sale alone says little.</p>
      </>}
    </Shell>
  );
}
