/**
 * Market data seam. The original app shelled out to a local CLI and to curl, which cannot
 * run on a public host and likely cannot be redistributed to customers. Implement
 * MarketData with a licensed provider, then select it with MARKET_DATA_PROVIDER.
 * The "sample" provider returns deterministic placeholder numbers and is always labeled.
 */
export type Quote = { symbol: string; price: number; change: number; pct: number; dayHigh: number; dayLow: number; volume: number };
export type CryptoRow = { symbol: string; price: number; pct: number; marketCap: number; volume: number; dayHigh: number; dayLow: number; low52: number; high52: number };
export type Vol = { vix: number; vix3m: number; vvix: number; skew: number; rv20: number; spx: number; callWall: number; gammaFlip: number; putWall: number };
export interface MarketData { name: string; licensed: boolean; quotes(symbols: string[]): Promise<Quote[]>; crypto(): Promise<CryptoRow[]>; markets(): Promise<{ name: string; pct: number }[]>; vol(): Promise<Vol>; }

const h = (s: string) => { let x = 2166136261; for (const c of s) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return (x >>> 0) / 4294967295; };
const day = () => new Date().toISOString().slice(0, 10);

const sample: MarketData = {
  name: 'sample', licensed: false,
  async quotes(symbols) {
    return symbols.map(symbol => {
      const base = 20 + h(symbol) * 600, pct = (h(symbol + day()) - 0.5) * 4;
      const price = +base.toFixed(2), change = +(price * pct / 100).toFixed(2);
      return { symbol, price, change, pct: +pct.toFixed(2), dayHigh: +(price * 1.012).toFixed(2), dayLow: +(price * 0.988).toFixed(2), volume: Math.round(h(symbol + 'v') * 5e7) };
    });
  },
  async crypto() {
    const c: [string, number, number, number, number, number, number][] = [['BTC', 71608.2, 1.43e12, 7.36e10, 73172, 71294, 60000], ['ETH', 2214.91, 2.67e11, 5.68e10, 2290, 2207, 1538], ['SOL', 82.36, 4.65e10, 2.01e10, 85.04, 81.92, 67.48], ['XRP', 1.33, 8.07e10, 2.11e10, 1.36, 1.33, 1.12]];
    return c.map(([symbol, price, marketCap, volume, dayHigh, dayLow, low52]) => ({ symbol, price, pct: +((h(symbol + day()) - 0.6) * 5).toFixed(2), marketCap, volume, dayHigh, dayLow, low52, high52: price * 1.8 }));
  },
  async markets() { return ['NYSE · Nasdaq', 'TSX', 'B3', 'LSE', 'Xetra', 'JSE', 'Tadawul', 'NSE', 'SSE', 'HKEX', 'TSE', 'ASX'].map(name => ({ name, pct: +((h(name + day()) - 0.5) * 2).toFixed(2) })); },
  async vol() { return { vix: 16.8, vix3m: 18.9, vvix: 92.4, skew: 138, rv20: 11.9, spx: 7774, callWall: 7800, gammaFlip: 7745, putWall: 7650 }; },
};
export function getProvider(): MarketData {
  const n = process.env.MARKET_DATA_PROVIDER || 'sample';
  if (n === 'sample') return sample;
  throw new Error(`Market data provider "${n}" is not implemented. Add it in lib/provider.ts.`);
}
