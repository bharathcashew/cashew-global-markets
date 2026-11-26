import { guard } from '@/lib/auth';
import { store } from '@/lib/store';
export const GET = guard(async (u) => Response.json({ positions: await store.getPositions(u) }));
export const POST = guard(async (u, req) => {
  const { positions } = await req.json();
  if (!Array.isArray(positions) || positions.length > 200) return Response.json({ error: 'positions array required' }, { status: 400 });
  const clean = positions.map((p: any) => ({ symbol: String(p.symbol).toUpperCase().trim(), shares: Number(p.shares), cost: Number(p.cost) }))
    .filter(p => /^[A-Z0-9.\-]{1,12}$/.test(p.symbol) && p.shares > 0 && p.cost >= 0);
  await store.setPositions(u, clean);
  return Response.json({ saved: clean.length });
});
