import type { Trade } from './calc';

export type Position = { symbol: string; shares: number; cost: number };
export type PnlMap = Record<string, { amount: number; notes: string }>;
export type Conn = { id: number; kind: 'rss' | 'mcp' | 'x' | 'alert'; name: string; url: string | null; secret: string | null; config: any };
export interface Store {
  listConns(u: string, kind?: Conn['kind']): Promise<Conn[]>;
  addConn(u: string, c: Omit<Conn, 'id'>): Promise<Conn>;
  updateConn(u: string, id: number, patch: Partial<Pick<Conn, 'config' | 'secret'>>): Promise<boolean>;
  deleteConn(u: string, id: number): Promise<boolean>;
  listTrades(u: string): Promise<Trade[]>;
  addTrade(u: string, t: Omit<Trade, 'id'>): Promise<Trade>;
  deleteTrade(u: string, id: number): Promise<boolean>;
  getPositions(u: string): Promise<Position[]>;
  setPositions(u: string, p: Position[]): Promise<void>;
  getPnl(u: string): Promise<PnlMap>;
  setPnl(u: string, m: PnlMap): Promise<void>;
}

/* In-memory store for local development. Data is lost on restart. */
function memory(): Store {
  const g = globalThis as any;
  const d = (g.__cgm ||= { trades: new Map<string, Trade[]>(), conns: new Map<string, Conn[]>(), pos: new Map<string, Position[]>(), pnl: new Map<string, PnlMap>(), seq: 1 });
  return {
    async listConns(u, k) { return (d.conns.get(u) || []).filter((c: Conn) => !k || c.kind === k); },
    async addConn(u, c) { const x = { ...c, id: d.seq++ } as Conn; d.conns.set(u, [...(d.conns.get(u) || []), x]); return x; },
    async updateConn(u, id, p) { const c = (d.conns.get(u) || []).find((x: Conn) => x.id === id); if (!c) return false; Object.assign(c, p); return true; },
    async deleteConn(u, id) { const l = d.conns.get(u) || []; const n = l.filter((c: Conn) => c.id !== id); d.conns.set(u, n); return n.length !== l.length; },
    async listTrades(u) { return [...(d.trades.get(u) || [])].sort((a, b) => b.entry_date.localeCompare(a.entry_date) || b.id - a.id); },
    async addTrade(u, t) { const x = { ...t, id: d.seq++ } as Trade; d.trades.set(u, [...(d.trades.get(u) || []), x]); return x; },
    async deleteTrade(u, id) { const l = d.trades.get(u) || []; const n = l.filter((t: Trade) => t.id !== id); d.trades.set(u, n); return n.length !== l.length; },
    async getPositions(u) { return d.pos.get(u) || []; },
    async setPositions(u, p) { d.pos.set(u, p); },
    async getPnl(u) { return d.pnl.get(u) || {}; },
    async setPnl(u, m) { d.pnl.set(u, { ...(d.pnl.get(u) || {}), ...m }); },
  };
}

/* Postgres store. Every row carries user_id and every query filters on it. */
function postgres(): Store {
  const { Pool } = require('pg');
  const g = globalThis as any;
  const pool = (g.__cgmPool ||= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }));
  let ready: Promise<void> | null = null;
  const init = () => (ready ||= pool.query(`
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY, user_id TEXT NOT NULL, symbol TEXT NOT NULL, side TEXT NOT NULL, asset_class TEXT NOT NULL DEFAULT 'Stock',
      quantity DOUBLE PRECISION NOT NULL, entry_price DOUBLE PRECISION NOT NULL, exit_price DOUBLE PRECISION,
      entry_date TEXT NOT NULL, exit_date TEXT, status TEXT NOT NULL DEFAULT 'OPEN', setup TEXT, notes TEXT,
      tags JSONB NOT NULL DEFAULT '[]', fees DOUBLE PRECISION DEFAULT 0, stop_loss DOUBLE PRECISION, take_profit DOUBLE PRECISION);
    CREATE INDEX IF NOT EXISTS trades_user ON trades(user_id);
    CREATE TABLE IF NOT EXISTS connections (id SERIAL PRIMARY KEY, user_id TEXT NOT NULL, kind TEXT NOT NULL, name TEXT NOT NULL, url TEXT, secret TEXT, config JSONB NOT NULL DEFAULT '{}');
    CREATE INDEX IF NOT EXISTS conns_user ON connections(user_id);
    CREATE TABLE IF NOT EXISTS positions (user_id TEXT NOT NULL, symbol TEXT NOT NULL, shares DOUBLE PRECISION NOT NULL, cost DOUBLE PRECISION NOT NULL, PRIMARY KEY(user_id, symbol));
    CREATE TABLE IF NOT EXISTS pnl_entries (user_id TEXT NOT NULL, date TEXT NOT NULL, amount DOUBLE PRECISION NOT NULL, notes TEXT DEFAULT '', PRIMARY KEY(user_id, date));
  `).then(() => undefined));
  const q = async (s: string, p: unknown[]) => { await init(); return pool.query(s, p); };
  return {
    async listConns(u, k) { return (await q('SELECT id,kind,name,url,secret,config FROM connections WHERE user_id=$1' + (k ? ' AND kind=$2' : '') + ' ORDER BY id', k ? [u, k] : [u])).rows; },
    async addConn(u, c) { return (await q('INSERT INTO connections (user_id,kind,name,url,secret,config) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,kind,name,url,secret,config', [u, c.kind, c.name, c.url, c.secret, JSON.stringify(c.config ?? {})])).rows[0]; },
    async updateConn(u, id, p) { const cur = (await q('SELECT config,secret FROM connections WHERE id=$1 AND user_id=$2', [id, u])).rows[0]; if (!cur) return false; await q('UPDATE connections SET config=$3, secret=$4 WHERE id=$1 AND user_id=$2', [id, u, JSON.stringify(p.config ?? cur.config), p.secret ?? cur.secret]); return true; },
    async deleteConn(u, id) { return (await q('DELETE FROM connections WHERE id=$1 AND user_id=$2', [id, u])).rowCount > 0; },
    async listTrades(u) { return (await q('SELECT * FROM trades WHERE user_id=$1 ORDER BY entry_date DESC, id DESC LIMIT 500', [u])).rows.map(({ user_id, ...t }: any) => t); },
    async addTrade(u, t) {
      const r = await q(`INSERT INTO trades (user_id,symbol,side,asset_class,quantity,entry_price,exit_price,entry_date,exit_date,status,setup,notes,tags,fees,stop_loss,take_profit)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
        [u, t.symbol, t.side, t.asset_class, t.quantity, t.entry_price, t.exit_price, t.entry_date, t.exit_date, t.status, t.setup, t.notes, JSON.stringify(t.tags), t.fees, t.stop_loss, t.take_profit]);
      const { user_id, ...x } = r.rows[0]; return x;
    },
    async deleteTrade(u, id) { return (await q('DELETE FROM trades WHERE id=$1 AND user_id=$2', [id, u])).rowCount > 0; },
    async getPositions(u) { return (await q('SELECT symbol,shares,cost FROM positions WHERE user_id=$1 ORDER BY symbol', [u])).rows; },
    async setPositions(u, p) {
      await q('DELETE FROM positions WHERE user_id=$1', [u]);
      for (const x of p) await q('INSERT INTO positions (user_id,symbol,shares,cost) VALUES ($1,$2,$3,$4)', [u, x.symbol, x.shares, x.cost]);
    },
    async getPnl(u) { const m: PnlMap = {}; for (const r of (await q('SELECT date,amount,notes FROM pnl_entries WHERE user_id=$1', [u])).rows) m[r.date] = { amount: r.amount, notes: r.notes || '' }; return m; },
    async setPnl(u, m) { for (const [d, v] of Object.entries(m)) await q(`INSERT INTO pnl_entries (user_id,date,amount,notes) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id,date) DO UPDATE SET amount=EXCLUDED.amount, notes=EXCLUDED.notes`, [u, d, v.amount, v.notes || '']); },
  };
}
export const store: Store = process.env.DATABASE_URL ? postgres() : memory();
