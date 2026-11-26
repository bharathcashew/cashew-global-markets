'use client';
import { useEffect, useRef } from 'react';
import { speak } from '@/lib/voice';
import { MARKETS } from '@/lib/universe';
import { marketStatus } from '@/lib/hours';

export type Rule = { id: number; name: string; config: { type: string; symbol?: string; value?: number; exchange?: string } };
export type Fired = { at: string; text: string };
const LOG = 'cgm_alert_log', DONE = 'cgm_alert_done';
const jget = (k: string, d: any) => { try { return JSON.parse(localStorage.getItem(k) || '') ?? d; } catch { return d; } };
const jset = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
export const getLog = (): Fired[] => jget(LOG, []);

/** Checks the user's alert rules every minute and speaks new ones when voice is on. Mounted once in the shell. */
export default function AlertRunner() {
  const rules = useRef<Rule[]>([]); const prev = useRef<Record<string, boolean>>({});
  useEffect(() => {
    let live = true;
    const fire = (text: string, key?: string) => {
      if (key) { const d = jget(DONE, {}); const today = new Date().toISOString().slice(0, 10); if (d[key] === today) return; jset(DONE, { ...d, [key]: today }); }
      jset(LOG, [{ at: new Date().toISOString(), text }, ...getLog()].slice(0, 50)); window.dispatchEvent(new Event('cgm-alert')); speak(text);
    };
    const loadRules = async () => { try { const r = await fetch('/api/connections'); if (r.ok) rules.current = (await r.json()).connections.filter((c: any) => c.kind === 'alert'); } catch {} };
    const tick = async () => {
      if (!live) return;
      const now = new Date();
      for (const m of MARKETS) {
        const o = marketStatus(m, now).isOpen; const was = prev.current[m.name]; prev.current[m.name] = o;
        if (was === undefined || was === o) continue;
        for (const r of rules.current) if (r.config.exchange === m.name && r.config.type === (o ? 'market_open' : 'market_close')) fire(`${m.name} is now ${o ? 'open' : 'closed'}.`);
      }
      const syms = [...new Set(rules.current.filter(r => r.config.symbol).map(r => r.config.symbol!))];
      if (!syms.length) return;
      try {
        const r = await fetch('/api/quotes?symbols=' + syms.join(',')); if (!r.ok) return; const j = await r.json();
        const pre = j.source === 'sample' ? 'Sample data. ' : '';
        for (const q of j.quotes) for (const rule of rules.current) {
          const c = rule.config; if (c.symbol !== q.symbol) continue;
          if (c.type === 'price_above' && q.price > c.value!) fire(`${pre}${q.symbol} is above ${c.value}, at ${q.price.toFixed(2)}.`, rule.id + ':a');
          if (c.type === 'price_below' && q.price < c.value!) fire(`${pre}${q.symbol} is below ${c.value}, at ${q.price.toFixed(2)}.`, rule.id + ':b');
          if (c.type === 'move_pct' && Math.abs(q.pct) >= c.value!) fire(`${pre}${q.symbol} is ${q.pct >= 0 ? 'up' : 'down'} ${Math.abs(q.pct).toFixed(2)} percent.`, rule.id + ':m');
        }
      } catch {}
    };
    const reload = () => { loadRules().then(tick); };
    loadRules().then(tick); const t = setInterval(tick, 60_000); const t2 = setInterval(loadRules, 300_000);
    window.addEventListener('cgm-alerts-changed', reload);
    return () => { live = false; clearInterval(t); clearInterval(t2); window.removeEventListener('cgm-alerts-changed', reload); };
  }, []);
  return null;
}
