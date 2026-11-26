export const INDEXES: Record<string, { label: string; sectors: { name: string; symbols: string[] }[] }> = {
  SP500: { label: 'S&P 500 (sample subset)', sectors: [
    { name: 'Technology', symbols: ['NVDA', 'MSFT', 'AAPL', 'AVGO', 'AMD', 'ORCL', 'CRM', 'ADBE', 'CSCO', 'INTC', 'QCOM', 'TXN'] },
    { name: 'Communication services', symbols: ['META', 'GOOGL', 'NFLX', 'DIS', 'T', 'VZ'] },
    { name: 'Consumer discretionary', symbols: ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'SBUX'] },
    { name: 'Financials', symbols: ['JPM', 'V', 'MA', 'BAC', 'WFC', 'GS'] },
    { name: 'Health care', symbols: ['LLY', 'UNH', 'JNJ', 'ABBV', 'MRK', 'PFE'] },
    { name: 'Industrials', symbols: ['GE', 'CAT', 'RTX', 'UNP', 'HON', 'BA'] },
    { name: 'Consumer staples', symbols: ['WMT', 'PG', 'KO', 'COST'] },
    { name: 'Energy', symbols: ['XOM', 'CVX', 'COP'] },
  ] },
  NASDAQ: { label: 'Nasdaq 100 (sample subset)', sectors: [{ name: 'Mega cap', symbols: ['NVDA', 'MSFT', 'AAPL', 'AMZN', 'META', 'GOOGL', 'AVGO', 'TSLA', 'NFLX', 'COST', 'AMD', 'ADBE'] }] },
  DJIA: { label: 'Dow 30 (sample subset)', sectors: [{ name: 'Components', symbols: ['AAPL', 'MSFT', 'JPM', 'V', 'UNH', 'HD', 'CAT', 'GS', 'MCD', 'KO', 'WMT', 'BA'] }] },
};
export const MARKETS: { name: string; tz: string; open: string; close: string; x: number; y: number; days?: number[] }[] = [
  { name: 'NYSE · Nasdaq', tz: 'America/New_York', open: '09:30', close: '16:00', x: 294.4, y: 136.1 },
  { name: 'TSX', tz: 'America/Toronto', open: '09:30', close: '16:00', x: 279.4, y: 128.6 },
  { name: 'B3', tz: 'America/Sao_Paulo', open: '10:00', close: '17:00', x: 370.6, y: 315.3 },
  { name: 'LSE', tz: 'Europe/London', open: '08:00', close: '16:30', x: 499.7, y: 106.9 },
  { name: 'Xetra', tz: 'Europe/Berlin', open: '09:00', close: '17:30', x: 524.2, y: 110.8 },
  { name: 'JSE', tz: 'Africa/Johannesburg', open: '09:00', close: '17:00', x: 577.8, y: 322.2 },
  { name: 'Tadawul', tz: 'Asia/Riyadh', open: '10:00', close: '15:00', x: 629.7, y: 181.4, days: [0, 1, 2, 3, 4] },
  { name: 'NSE', tz: 'Asia/Kolkata', open: '09:15', close: '15:30', x: 702.5, y: 197 },
  { name: 'SSE', tz: 'Asia/Shanghai', open: '09:30', close: '15:00', x: 837.5, y: 163.3 },
  { name: 'HKEX', tz: 'Asia/Hong_Kong', open: '09:30', close: '16:00', x: 817.2, y: 188 },
  { name: 'TSE', tz: 'Asia/Tokyo', open: '09:00', close: '15:30', x: 888.1, y: 150.8 },
  { name: 'ASX', tz: 'Australia/Sydney', open: '10:00', close: '16:00', x: 920, y: 344.2 },
];
