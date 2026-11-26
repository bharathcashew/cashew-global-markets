'use client';
const LAND = ["33.3,66.7 108.3,55.6 166.7,55.6 236.1,50 277.8,61.1 327.8,83.3 347.2,111.1 313.9,125 288.9,144.4 275,163.9 277.8,180.6 250,169.4 230.6,177.8 230.6,197.2 250,191.7 255.6,205.6 269.4,222.2 283.3,227.8 261.1,216.7 244.4,208.3 208.3,194.4 188.9,169.4 175,161.1 155.6,138.9 152.8,113.9 125,88.9 83.3,83.3", "297.2,33.3 333.3,22.2 416.7,19.4 444.4,33.3 438.9,55.6 380.6,83.3 355.6,69.4 338.9,41.7", "286.1,227.8 300,216.7 327.8,222.2 355.6,236.1 361.1,250 402.8,266.7 391.7,291.7 366.7,322.2 338.9,350 319.4,366.7 311.1,397.2 294.4,388.9 297.2,355.6 302.8,305.6 288.9,288.9 275,263.9 277.8,244.4", "475,147.2 475,130.6 497.2,122.2 488.9,116.7 505.6,108.3 522.2,100 527.8,91.7 513.9,77.8 538.9,61.1 569.4,52.8 583.3,55.6 583.3,83.3 577.8,111.1 583.3,125 577.8,136.1 561.1,147.2 544.4,144.4 533.3,133.3 522.2,127.8 508.3,133.3 500,144.4 486.1,150", "486.1,111.1 491.7,97.2 486.1,88.9 494.4,88.9 502.8,102.8 502.8,108.3", "452.8,191.7 472.2,166.7 483.3,152 527.8,152 530.6,160 555.6,165 588.9,165 597.2,172.2 619.4,216.7 641.7,216.7 611.1,258.3 611.1,291.7 597.2,319.4 575,344.4 550,344.4 533.3,300 525,252.8 527.8,238.9 477.8,238.9 455.6,216.7", "583.3,55.6 722.2,47.2 805.6,36.1 888.9,47.2 972.2,55.6 1000,66.7 944.4,83.3 944.4,97.2 894.4,105.6 888.9,138.9 850,152.8 838.9,166.7 833.3,186.1 800,191.7 791.7,222.2 777.8,241.7 772.2,222.2 761.1,202.8 744.4,188.9 722.2,208.3 713.9,227.8 700,194.4 686.1,183.3 658.3,180.6 655.6,177.8 650,190 641.7,216.7 619.4,216.7 597.2,172.2 600,150 577.8,136.1 583.3,125 583.3,83.3", "861,164 878,155 892,142 897,128 890,128 884,146 868,160", "816.7,311.1 819.4,344.4 863.9,336.1 891.7,355.6 916.7,352.8 925,325 905.6,302.8 894.4,280.6 877.8,283.3 858.3,291.7 838.9,300"];
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
    <svg viewBox="0 0 1000 500" role="img" aria-label={`World map of ${markets.length} exchanges. ${open} open and ${markets.length - open} closed.`} style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 8, background: 'var(--ocean)' }}>
      <g stroke="var(--line)" strokeWidth="1"><line x1="0" y1="250" x2="1000" y2="250" /><line x1="500" y1="0" x2="500" y2="500" /></g>
      <g fill="var(--land)" stroke="var(--landL)" strokeWidth="1" strokeLinejoin="round">{LAND.map((p, i) => <polygon key={i} points={p} />)}</g>
      {rects.map((x, i) => <rect key={i} x={x} y="0" width={w} height="500" style={{ fill: 'var(--night)', opacity: 'var(--nightO)' as any }} />)}
      <g fontFamily="Inter, system-ui, sans-serif" fontSize="15" fontWeight="500">
        {markets.map(m => { const c = m.pct == null ? 'var(--mute)' : m.pct >= 0 ? 'var(--up)' : 'var(--dn)'; const o = OFF[m.name] || { dx: 10, dy: -9, a: 'start' as const }; const lx = m.x + o.dx, ly = m.y + o.dy;
          return (<g key={m.name} onClick={() => onSelect(m.name)} style={{ cursor: 'pointer' }} role="button" aria-label={`${m.name} ${m.open ? 'open' : 'closed'}${m.pct == null ? '' : ' ' + m.pct.toFixed(2) + ' percent'}`}>
            {selected === m.name && <circle cx={m.x} cy={m.y} r="12" fill="none" stroke="var(--ac)" strokeWidth="2" />}
            <circle cx={m.x} cy={m.y} r={m.open ? 6 : 5.5} fill={m.open ? c : 'var(--ocean)'} stroke={c} strokeWidth="2" />
            <text x={lx} y={ly} textAnchor={o.a} fill={m.open ? 'var(--ink)' : 'var(--mute)'}>{m.name}{m.pct == null ? '' : ` ${m.pct >= 0 ? '+' : '-'}${Math.abs(m.pct).toFixed(2)}%`}</text>
          </g>); })}
      </g>
    </svg>
  );
}
