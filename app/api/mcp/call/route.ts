import { guard } from '@/lib/auth';
import { store } from '@/lib/store';
import { open } from '@/lib/secret';
import { callTool } from '@/lib/mcp';
import { rateLimit } from '@/lib/ai';

/** Runs one enabled tool. Tools not marked read-only need confirm: true on every call. */
export const POST = guard(async (u, req) => {
  rateLimit(u + ':mcp', 60);
  const { connectionId, tool, args, confirm } = await req.json();
  const c = (await store.listConns(u, 'mcp')).find(x => x.id === Number(connectionId));
  if (!c) return Response.json({ error: 'connection not found' }, { status: 404 });
  const t = (c.config.tools || []).find((x: any) => x.name === tool);
  if (!t) return Response.json({ error: 'unknown tool' }, { status: 404 });
  if (!t.enabled) return Response.json({ error: 'That tool is turned off' }, { status: 403 });
  if (!t.readOnly && confirm !== true) return Response.json({ error: 'This tool can change things. Confirmation required.', needsConfirm: true }, { status: 409 });
  const a = args && typeof args === 'object' && !Array.isArray(args) ? args : {};
  return Response.json({ result: await callTool(c.url!, c.secret ? open(c.secret) : null, tool, a) });
});
