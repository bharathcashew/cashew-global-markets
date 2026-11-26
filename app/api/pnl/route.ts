import { guard } from '@/lib/auth';
import { store } from '@/lib/store';
export const GET = guard(async (u) => Response.json({ pnl: await store.getPnl(u) }));
export const POST = guard(async (u, req) => {
  const { pnl } = await req.json();
  if (!pnl || typeof pnl !== 'object') return Response.json({ error: 'pnl object required' }, { status: 400 });
  const clean: Record<string, { amount: number; notes: string }> = {};
  for (const [d, v] of Object.entries<any>(pnl)) if (/^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Number(v?.amount))) clean[d] = { amount: Number(v.amount), notes: String(v.notes || '').slice(0, 500) };
  await store.setPnl(u, clean);
  return Response.json({ saved: Object.keys(clean).length });
});
