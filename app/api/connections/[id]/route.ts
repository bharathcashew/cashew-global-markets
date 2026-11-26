import { guard } from '@/lib/auth';
import { store } from '@/lib/store';
import { open } from '@/lib/secret';
import { listTools, type McpTool } from '@/lib/mcp';

export const DELETE = guard(async (u, _r, ctx) => {
  const { id } = await ctx.params;
  return (await store.deleteConn(u, Number(id))) ? Response.json({ deleted: true }) : Response.json({ error: 'not found' }, { status: 404 });
});
/** PATCH { tools: { name: boolean } } toggles tools. PATCH { refresh: true } re-reads the server's tool list. */
export const PATCH = guard(async (u, req, ctx) => {
  const { id } = await ctx.params; const b = await req.json();
  const c = (await store.listConns(u, 'mcp')).find(x => x.id === Number(id));
  if (!c) return Response.json({ error: 'not found' }, { status: 404 });
  let tools: McpTool[] = c.config.tools || [];
  if (b.refresh) tools = await listTools(c.url!, c.secret ? open(c.secret) : null, tools);
  if (b.tools && typeof b.tools === 'object') tools = tools.map(t => (t.name in b.tools ? { ...t, enabled: !!b.tools[t.name] } : t));
  await store.updateConn(u, c.id, { config: { ...c.config, tools } });
  return Response.json({ tools });
});
