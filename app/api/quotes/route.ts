import { guard } from '@/lib/auth';
import { getProvider } from '@/lib/provider';
import { INDEXES } from '@/lib/universe';
export const GET = guard(async (_u, req) => {
  const url = new URL(req.url);
  const idx = url.searchParams.get('index');
  let symbols = (url.searchParams.get('symbols') || '').split(',').map(s => s.trim().toUpperCase()).filter(s => /^[A-Z0-9.\-]{1,12}$/.test(s));
  if (idx && INDEXES[idx]) symbols = INDEXES[idx].sectors.flatMap(s => s.symbols);
  symbols = [...new Set(symbols)].slice(0, 100);
  const p = getProvider();
  return Response.json({ quotes: await p.quotes(symbols), source: p.name, licensed: p.licensed, asOf: new Date().toISOString() });
});
