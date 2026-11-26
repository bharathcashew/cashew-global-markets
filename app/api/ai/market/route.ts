import { guard } from '@/lib/auth';
import { ask, rateLimit } from '@/lib/ai';
export const POST = guard(async (u, req) => {
  rateLimit(u);
  const { index, breadth, sectors, movers } = await req.json();
  const sec = (sectors || []).slice(0, 15).map((s: any) => `${String(s.name).slice(0, 40)} ${Number(s.avg).toFixed(2)}%`).join(', ');
  const g = (movers?.gainers || []).slice(0, 5).map((m: any) => `${String(m.symbol).slice(0, 10)} ${Number(m.pct).toFixed(2)}%`).join(', ');
  const l = (movers?.losers || []).slice(0, 5).map((m: any) => `${String(m.symbol).slice(0, 10)} ${Number(m.pct).toFixed(2)}%`).join(', ');
  const prompt = `You are a market analyst. Write a 3 bullet commentary under 150 words for ${String(index).slice(0, 20)}: overall tone, sector leadership, one key risk or opportunity.
Breadth: ${Number(breadth?.advancing) || 0} up, ${Number(breadth?.declining) || 0} down, ${Number(breadth?.flat) || 0} flat. Sectors: ${sec || 'n/a'}. Gainers: ${g || 'n/a'}. Losers: ${l || 'n/a'}.
Figures may be sample data. Not investment advice.`;
  return Response.json({ commentary: await ask(prompt, 300) });
});
