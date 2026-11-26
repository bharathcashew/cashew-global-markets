import { guard } from '@/lib/auth';
import { store } from '@/lib/store';
import { ask, rateLimit } from '@/lib/ai';
import { tradePnl, tradeR, tradeStats } from '@/lib/calc';

export const POST = guard(async (u, req) => {
  rateLimit(u);
  const { mode, tradeId } = await req.json();
  const trades = await store.listTrades(u);
  let prompt: string;
  if (mode === 'trade') {
    const t = trades.find(x => x.id === Number(tradeId));
    if (!t) return Response.json({ error: 'trade not found' }, { status: 404 });
    const p = tradePnl(t), r = tradeR(t);
    prompt = `You are an expert trading coach reviewing a journal entry. Give 3 to 5 concise bullet points on risk management, setup quality, entry and exit timing, and one specific improvement.
Symbol ${t.symbol}, ${t.side}, ${t.asset_class}, qty ${t.quantity}, entry $${t.entry_price} on ${t.entry_date}, exit ${t.exit_price ?? 'open'}, stop ${t.stop_loss ?? 'none'}, target ${t.take_profit ?? 'none'}, P&L ${p == null ? 'open' : '$' + p.toFixed(2)}, R ${r == null ? 'n/a' : r.toFixed(2)}, setup ${t.setup || 'none'}, notes ${t.notes || 'none'}.
This is educational feedback, not investment advice.`;
  } else if (mode === 'journal') {
    const s = tradeStats(trades);
    const recent = trades.slice(0, 20).map(t => `${t.entry_date} ${t.symbol} ${t.side} ${t.quantity}@${t.entry_price} ${t.status}`).join('\n');
    prompt = `You are an expert trading coach. From these journal stats give 4 or 5 bullets on winning patterns, losing patterns, risk discipline and one concrete improvement.
Trades ${s.total_trades}, win rate ${s.win_rate.toFixed(1)}%, total P&L $${s.total_pnl.toFixed(2)}, avg R ${s.avg_r?.toFixed(2) ?? 'n/a'}, open ${s.open_trades}.
Recent:\n${recent || 'none'}\nEducational feedback, not investment advice.`;
  } else return Response.json({ error: 'mode must be trade or journal' }, { status: 400 });
  return Response.json({ analysis: await ask(prompt, 500) });
});
