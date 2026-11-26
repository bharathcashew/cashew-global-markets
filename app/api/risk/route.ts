import { guard } from '@/lib/auth';
import { store } from '@/lib/store';
import { getProvider } from '@/lib/provider';
import { risk } from '@/lib/risk';
export const GET = guard(async (u) => {
  const positions = await store.getPositions(u);
  if (positions.length < 2) return Response.json({ empty: true, source: getProvider().name });
  const p = getProvider(); const days = 250; const syms = positions.map(x => x.symbol);
  const [q, h] = await Promise.all([p.quotes(syms), p.history([...syms, 'SPY'], days)]);
  const px = Object.fromEntries(q.map(x => [x.symbol, x.price]));
  const out = risk(positions.map(x => ({ symbol: x.symbol, value: (px[x.symbol] ?? x.cost) * x.shares })), h, h.SPY);
  return Response.json({ ...out, source: p.name, licensed: p.licensed });
});
