'use client';
import { useEffect, useState, type ReactNode } from 'react';

export function Chg({ v, d = 2, suf = '%', money = false }: { v: number; d?: number; suf?: string; money?: boolean }) {
  const s = `${money ? '$' : ''}${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}${money ? '' : suf}`;
  return <span className={`num ${v >= 0 ? 'up ua' : 'dn da'}`}>{v >= 0 ? '+' : '-'}{s}</span>;
}
export const Card = ({ title, extra, children }: { title?: string; extra?: ReactNode; children: ReactNode }) => (
  <section className="card">{title && <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12 }}><h2 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h2>{extra}</div>}{children}</section>
);
export const Kpi = ({ l, children }: { l: string; children: ReactNode }) => (<div className="card kpi"><div className="l">{l}</div><div className="v num">{children}</div></div>);
export const Kpis = ({ children }: { children: ReactNode }) => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>{children}</div>;
export function Table({ cols, heads, rows, right = [] }: { cols: string; heads: string[]; rows: ReactNode[][]; right?: number[] }) {
  const g = { gridTemplateColumns: cols };
  return (<div className="tbl"><div className="tr th" style={g}>{heads.map((h, i) => <span key={i} className={right.includes(i) ? 'r' : ''}>{h}</span>)}</div>
    {rows.map((r, k) => <div className="tr" style={g} key={k}>{r.map((c, i) => <span key={i} className={right.includes(i) ? 'r num' : ''}>{c}</span>)}</div>)}</div>);
}
export function useApi<T>(url: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(true);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!url) return; let live = true; setLoading(true);
    fetch(url).then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error || r.statusText); if (live) { setData(j); setError(null); } })
      .catch(e => live && setError(e.message)).finally(() => live && setLoading(false));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, n, ...deps]);
  return { data, error, loading, reload: () => setN(x => x + 1) };
}
export const post = async (url: string, body: unknown) => { const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); const j = await r.json(); if (!r.ok) throw new Error(j.error || r.statusText); return j; };
export const Status = ({ loading, error }: { loading: boolean; error: string | null }) => error ? <p className="dn" role="alert">{error}</p> : loading ? <p className="mu">Loading…</p> : null;
export const SampleChip = ({ src }: { src?: string }) => src && src !== 'sample' ? null : <span className="chip" style={{ color: 'var(--warn)' }}>Sample data</span>;
