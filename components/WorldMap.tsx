'use client';
import { LAND_PATH, BORDER_PATH, GRATICULE_PATH } from '../lib/worldpaths';
const OFF: Record<string, { dx: number; dy: number; a: 'start' | 'end' | 'middle' }> = {
  'NYSE · Nasdaq': { dx: 10, dy: 5, a: 'start' }, TSX: { dx: -10, dy: -9, a: 'end' }, LSE: { dx: -10, dy: -9, a: 'end' }, Tadawul: { dx: -10, dy: -9, a: 'end' },
  SSE: { dx: -10, dy: -9, a: 'end' }, HKEX: { dx: -10, dy: 5, a: 'end' }, NSE: { dx: 0, dy: 24, a: 'middle' }, ASX: { dx: -10, dy: -9, a: 'end' },
};
export type MapMarket = { name: string; x: number; y: number; open: boolean; pct: number | null };
export default function WorldMap({ markets, now, selected, onSelect }: { markets: MapMarket[]; now: Date; selected: string | null; onSelect: (n: string) => void }) {
  const h = now.getUTCHours() + now.getUTCMinutes() / 60;
  const nightX = (((12 - h) * 15 + 180 + 180 + 360) % 360) / 360 * 1000; // x of the anti-solar longitude
  const w = 500; const x0 = nightX - w / 2;
  const rects = [x0, x0 + 1000, x0 - 1000];
  const open = markets.filter(m => m.open).length;
  return (
    <svg viewBox="0 14 1000 400" role="img" aria-label={`World map of ${markets.length} exchanges. ${open} open and ${markets.length - open} closed.`} style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 10 }}>
      <defs>
        <linearGradient id="seaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--seaA)" /><stop offset="1" stopColor="var(--seaB)" /></linearGradient>
        <linearGradient id="landG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--landA)" /><stop offset="1" stopColor="var(--landB)" /></linearGradient>
        <filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="14" /></filter>
        <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3.2" /></filter>
      </defs>
      <rect x="0" y="0" width="1000" height="500" fill="url(#seaG)" />
      <path d={GRATICULE_PATH} fill="none" stroke="var(--grat)" strokeWidth="0.6" />
      <path d={LAND_PATH} fill="url(#landG)" stroke="var(--landL)" strokeWidth="0.8" strokeLinejoin="round" />
      <path d={BORDER_PATH} fill="none" stroke="var(--landL)" strokeWidth="0.45" strokeLinejoin="round" opacity="0.8" />
      <g filter="url(#soft)">{rects.map((x, i) => <rect key={i} x={x} y="0" width={w} height="500" style={{ fill: 'var(--night)', opacity: 'var(--nightO)' as any }} />)}</g>
      <g fontFamily="Inter, system-ui, sans-serif" fontSize="14" fontWeight="600">
        {markets.map(m => { const c = m.pct == null ? 'var(--mute)' : m.pct >= 0 ? 'var(--up)' : 'var(--dn)'; const o = OFF[m.name] || { dx: 10, dy: -9, a: 'start' as const }; const lx = m.x + o.dx, ly = m.y + o.dy;
          return (<g key={m.name} onClick={() => onSelect(m.name)} style={{ cursor: 'pointer' }} role="button" aria-label={`${m.name} ${m.open ? 'open' : 'closed'}${m.pct == null ? '' : ' ' + m.pct.toFixed(2) + ' percent'}`}>
            {m.open && <circle cx={m.x} cy={m.y} r="9" fill={c} opacity="0.55" filter="url(#glow)" />}
            {m.open && <circle className="pulse" cx={m.x} cy={m.y} r="7" fill="none" stroke={c} strokeWidth="1.5" />}
            {selected === m.name && <circle cx={m.x} cy={m.y} r="13" fill="none" stroke="var(--ac)" strokeWidth="2" />}
            <circle cx={m.x} cy={m.y} r={m.open ? 6 : 5} fill={m.open ? c : 'var(--seaB)'} stroke={m.open ? 'var(--halo)' : c} strokeWidth={m.open ? 1.5 : 2} />
            <text x={lx} y={ly} textAnchor={o.a} fill={m.open ? 'var(--ink)' : 'var(--sub)'} stroke="var(--halo)" strokeWidth="3.5" paintOrder="stroke" strokeLinejoin="round">{m.name}{m.pct == null ? '' : ` ${m.pct >= 0 ? '+' : '-'}${Math.abs(m.pct).toFixed(2)}%`}</text>
          </g>); })}
      </g>
    </svg>
  );
}
