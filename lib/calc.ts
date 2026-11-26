export type Trade = {
  id: number; symbol: string; side: 'LONG' | 'SHORT'; asset_class: string; quantity: number;
  entry_price: number; exit_price: number | null; entry_date: string; exit_date: string | null;
  status: 'OPEN' | 'CLOSED' | 'PARTIAL'; setup: string | null; notes: string | null;
  tags: string[]; fees: number; stop_loss: number | null; take_profit: number | null;
};
export function tradePnl(t: Trade): number | null {
  if (t.status !== 'CLOSED' || t.exit_price == null) return null;
  const m = t.side === 'SHORT' ? -1 : 1;
  return m * (t.exit_price - t.entry_price) * t.quantity - (t.fees || 0);
}
export function tradeR(t: Trade): number | null {
  if (!t.stop_loss) return null;
  const risk = Math.abs(t.entry_price - t.stop_loss) * t.quantity;
  const p = tradePnl(t);
  return risk > 0 && p != null ? p / risk : null;
}
export function tradeStats(trades: Trade[]) {
  const closed = trades.filter(t => t.status === 'CLOSED' && t.exit_price != null);
  let total = 0, wins = 0, losses = 0, rSum = 0, rN = 0;
  let best: { symbol: string; pnl: number } | null = null, worst: { symbol: string; pnl: number } | null = null;
  for (const t of closed) {
    const p = tradePnl(t); if (p == null) continue;
    total += p; if (p > 0) wins++; else if (p < 0) losses++;
    if (!best || p > best.pnl) best = { symbol: t.symbol, pnl: p };
    if (!worst || p < worst.pnl) worst = { symbol: t.symbol, pnl: p };
    const r = tradeR(t); if (r != null) { rSum += r; rN++; }
  }
  return {
    total_trades: trades.length, open_trades: trades.filter(t => t.status === 'OPEN').length, closed_trades: closed.length,
    total_pnl: total, win_rate: closed.length ? (wins / closed.length) * 100 : 0, wins, losses,
    avg_r: rN ? rSum / rN : null, best_trade: best, worst_trade: worst,
  };
}
export const fmtMoney = (v: number, d = 2) => `${v < 0 ? '-' : ''}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
