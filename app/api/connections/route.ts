import { guard } from '@/lib/auth';
import { store, type Conn } from '@/lib/store';
import { seal } from '@/lib/secret';
import { assertSafeUrl } from '@/lib/safefetch';
import { fetchFeed } from '@/lib/rss';
import { listTools } from '@/lib/mcp';
import { MARKETS } from '@/lib/universe';

const pub = (c: Conn) => ({ id: c.id, kind: c.kind, name: c.name, url: c.url, hasSecret: !!c.secret, config: c.config });
export const GET = guard(async (u) => Response.json({ connections: (await store.listConns(u)).map(pub) }));

export const POST = guard(async (u, req) => {
  const b = await req.json();
  const kind = b.kind as Conn['kind'];
  if (kind === 'alert') {
    const t = String(b.config?.type);
    if (!['price_above', 'price_below', 'move_pct', 'market_open', 'market_close'].includes(t)) return Response.json({ error: 'Unknown alert type' }, { status: 400 });
    const alerts = (await store.listConns(u, 'alert'));
    if (alerts.length >= 30) return Response.json({ error: 'Alert limit reached (30)' }, { status: 400 });
    let config: any;
    if (t.startsWith('market_')) {
      const ex = String(b.config.exchange || ''); if (!MARKETS.some(m => m.name === ex)) return Response.json({ error: 'Choose an exchange' }, { status: 400 });
      config = { type: t, exchange: ex };
    } else {
      const symbol = String(b.config.symbol || '').toUpperCase().trim(); const value = Number(b.config.value);
      if (!/^[A-Z0-9.\-]{1,12}$/.test(symbol) || !Number.isFinite(value) || value <= 0) return Response.json({ error: 'Enter a symbol and a positive number' }, { status: 400 });
      config = { type: t, symbol, value };
    }
    const name = config.exchange ? `${config.exchange} ${t === 'market_open' ? 'opens' : 'closes'}` : t === 'move_pct' ? `${config.symbol} moves ${config.value}% or more` : `${config.symbol} ${t === 'price_above' ? 'above' : 'below'} ${config.value}`;
    return Response.json(pub(await store.addConn(u, { kind, name, url: null, secret: null, config })), { status: 201 });
  } const name = String(b.name || '').trim().slice(0, 60);
  if (!['rss', 'mcp', 'x'].includes(kind)) return Response.json({ error: 'kind must be rss, mcp or x' }, { status: 400 });
  if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });
  const existing = await store.listConns(u);
  if (existing.filter(c => c.kind !== 'alert').length >= 20) return Response.json({ error: 'Connection limit reached (20)' }, { status: 400 });
  if (kind === 'x') {
    if (existing.some(c => c.kind === 'x')) return Response.json({ error: 'X is already connected' }, { status: 400 });
    const t = String(b.secret || '').trim(); if (t.length < 20) return Response.json({ error: 'Paste your X API bearer token' }, { status: 400 });
    return Response.json(pub(await store.addConn(u, { kind, name: 'X', url: null, secret: seal(t), config: {} })), { status: 201 });
  }
  const url = String(b.url || '').trim(); await assertSafeUrl(url);
  if (kind === 'rss') {
    await fetchFeed(url, name);
    return Response.json(pub(await store.addConn(u, { kind, name, url, secret: null, config: {} })), { status: 201 });
  }
  const token = String(b.secret || '').trim() || null;
  const tools = await listTools(url, token);
  return Response.json(pub(await store.addConn(u, { kind, name, url, secret: token ? seal(token) : null, config: { tools } })), { status: 201 });
});
