import { guard } from '@/lib/auth';
import { store } from '@/lib/store';
export const DELETE = guard(async (u, _req, ctx) => {
  const { id } = await ctx.params;
  const ok = await store.deleteTrade(u, Number(id));
  return ok ? Response.json({ deleted: true }) : Response.json({ error: 'not found' }, { status: 404 });
});
