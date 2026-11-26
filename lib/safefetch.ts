import { lookup } from 'dns/promises';
import { isIP } from 'net';

/**
 * Fetch for user-supplied URLs (RSS feeds, MCP servers). Blocks private and metadata
 * addresses, follows at most 3 redirects with re-validation, caps time and size.
 * Residual risk: DNS can change between the check and the connection. For stronger
 * isolation run these calls from a dedicated egress proxy.
 */
const allowPrivate = () => process.env.ALLOW_PRIVATE_URLS === '1' && process.env.NODE_ENV !== 'production';
function privateIp(ip: string): boolean {
  if (ip.includes(':')) {
    const l = ip.toLowerCase();
    if (l === '::1' || l === '::' || l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe8') || l.startsWith('fe9') || l.startsWith('fea') || l.startsWith('feb')) return true;
    const m = l.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); return m ? privateIp(m[1]) : false;
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
}
export async function assertSafeUrl(raw: string): Promise<URL> {
  let u: URL; try { u = new URL(raw); } catch { throw new Error('Invalid URL'); }
  if (u.username || u.password) throw new Error('URLs with credentials are not allowed');
  if (allowPrivate()) { if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('Only http(s) URLs'); return u; }
  if (u.protocol !== 'https:') throw new Error('Only https URLs are allowed');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => { throw new Error('Could not resolve host'); });
  if (!addrs.length || addrs.some(a => privateIp(a.address))) throw new Error('That address is not allowed');
  return u;
}
export async function safeFetch(raw: string, init: RequestInit = {}, maxBytes = 1_000_000): Promise<{ status: number; headers: Headers; text: string }> {
  let url = raw;
  for (let i = 0; i < 4; i++) {
    const u = await assertSafeUrl(url);
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 10_000);
    try {
      const r = await fetch(u, { ...init, redirect: 'manual', signal: ctl.signal });
      if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { url = new URL(r.headers.get('location')!, u).toString(); continue; }
      const reader = r.body?.getReader(); const chunks: Uint8Array[] = []; let n = 0;
      while (reader) { const { done, value } = await reader.read(); if (done) break; n += value.length; if (n > maxBytes) { ctl.abort(); throw new Error('Response too large'); } chunks.push(value); }
      return { status: r.status, headers: r.headers, text: Buffer.concat(chunks).toString('utf8') };
    } finally { clearTimeout(t); }
  }
  throw new Error('Too many redirects');
}
