'use client';
import Shell from '@/components/Shell';
import WorldMap from '@/components/WorldMap';
import { Card, Chg, SampleChip, Table, useApi } from '@/components/ui';
import { MARKETS } from '@/lib/universe';
import { marketStatus } from '@/lib/hours';
import { useEffect, useState } from 'react';

export default function Markets() {
  const [now, setNow] = useState<Date | null>(null); const [sel, setSel] = useState<string | null>(null);
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  const { data } = useApi<{ markets: { name: string; pct: number }[]; source: string }>('/api/markets');
  const pct = Object.fromEntries((data?.markets || []).map(m => [m.name, m.pct]));
  const rows = now ? MARKETS.map(m => ({ ...m, ...marketStatus(m, now), pct: pct[m.name] ?? null })) : [];
  const open = rows.filter(r => r.isOpen).length;
  const up = rows.filter(r => r.pct != null && r.pct >= 0).length;
  return (
    <Shell title="World markets" sub={now ? `${now.toUTCString().slice(5, 22)} UTC · ${open} open · ${rows.length - open} closed` : ''} chip={<SampleChip src={data?.source} />}>
      <Card title="Map" extra={<span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span className="chip">{open} open</span><span className="chip mu">{rows.length - open} closed</span><span className="chip">{up} up · {rows.length - up} down</span></span>}>
        {now && <WorldMap now={now} selected={sel} onSelect={setSel} markets={rows.map(r => ({ name: r.name, x: r.x, y: r.y, open: r.isOpen, pct: r.pct }))} />}
        <p className="mu" style={{ marginTop: 12, fontSize: 12 }}>Solid dot: open now. Hollow: closed, showing the last session. Green is up, red is down, and the sign is always shown. Shaded area is night. Open status uses regular hours and weekdays only, holidays are not handled.</p>
      </Card>
      <Card title="Exchanges">
        <Table cols="1.4fr 1fr 1.2fr 1fr 1fr" heads={['Exchange', 'Local time', 'Hours', 'Status', 'Change']} right={[4]}
          rows={rows.map(r => [<b key="n" style={r.name === sel ? { color: 'var(--ac)' } : undefined}>{r.name}</b>, r.local, `${r.open} to ${r.close}`, <span key="s" className={r.isOpen ? '' : 'mu'}><span className={`dot ${r.isOpen ? 'o' : 'c'}`} /> {r.isOpen ? 'Open' : 'Closed'}</span>, r.pct == null ? '-' : <Chg key="c" v={r.pct} />])} />
      </Card>
    </Shell>
  );
}
