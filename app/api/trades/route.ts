import { guard } from '@/lib/auth';
import { store } from '@/lib/store';
import { tradePnl, tradeR, type Trade } from '@/lib/calc';

export const GET = guard(async (u) => {
  const trades = (await store.listTrades(u)).map(t => ({ ...t, pnl: tradePnl(t), r_multiple: tradeR(t) }));
  return Response.json({ trades, count: trades.length });
});

const num = (v: unknown) => (v === '' || v == null ? null : Number(v));
export const POST = guard(async (u, req) => {
  const b = await req.json();
  const symbol = String(b.symbol || '').toUpperCase().trim();
  const side = String(b.side || '').toUpperCase();
  if (!/^[A-Z0-9.\-]{1,12}$/.test(symbol)) return Response.json({ error: 'Valid symbol required' }, { status: 400 });
  if (side !== 'LONG' && side !== 'SHORT') return Response.json({ error: 'side must be LONG or SHORT' }, { status: 400 });
  const quantity = Number(b.quantity), entry = Number(b.entry_price);
  if (!(quantity > 0) || !(entry > 0)) return Response.json({ error: 'quantity and entry_price must be positive' }, { status: 400 });
  const exit = num(b.exit_price);
  const t: Omit<Trade, 'id'> = {
    symbol, side, asset_class: String(b.asset_class || 'Stock'), quantity, entry_price: entry, exit_price: exit,
    entry_date: String(b.entry_date || new Date().toISOString().slice(0, 10)), exit_date: b.exit_date || null,
    status: exit != null ? 'CLOSED' : 'OPEN', setup: b.setup || null, notes: b.notes || null,
    tags: Array.isArray(b.tags) ? b.tags.map(String) : [], fees: Number(b.fees) || 0, stop_loss: num(b.stop_loss), take_profit: num(b.take_profit),
  };
  return Response.json(await store.addTrade(u, t), { status: 201 });
});
