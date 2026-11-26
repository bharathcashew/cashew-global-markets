import { safeFetch } from './safefetch';
/** Minimal MCP client over Streamable HTTP. Each operation opens a fresh session. */
export type McpTool = { name: string; description: string; readOnly: boolean; enabled: boolean };
type Rpc = { id?: number; result?: any; error?: { message: string } };

function parse(text: string, ct: string | null): Rpc[] {
  if (ct?.includes('text/event-stream')) {
    return text.split(/\n\n+/).map(b => b.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).join('')).filter(Boolean).map(d => JSON.parse(d));
  }
  const j = text.trim() ? JSON.parse(text) : []; return Array.isArray(j) ? j : [j];
}
async function session<T>(url: string, token: string | null, fn: (rpc: (m: string, p?: object) => Promise<any>) => Promise<T>): Promise<T> {
  let sid: string | null = null; let n = 0;
  const post = async (body: object) => {
    const headers: Record<string, string> = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
    if (token) headers.authorization = `Bearer ${token}`; if (sid) headers['mcp-session-id'] = sid;
    const r = await safeFetch(url, { method: 'POST', headers, body: JSON.stringify(body) }, 2_000_000);
    if (r.headers.get('mcp-session-id')) sid = r.headers.get('mcp-session-id');
    if (r.status === 401 || r.status === 403) throw new Error('The server rejected the credentials');
    if (r.status >= 400) throw new Error(`Server returned ${r.status}`);
    return r;
  };
  const rpc = async (method: string, params: object = {}) => {
    const id = ++n; const r = await post({ jsonrpc: '2.0', id, method, params });
    const msg = parse(r.text, r.headers.get('content-type')).find(m => m.id === id);
    if (!msg) throw new Error('No response from server'); if (msg.error) throw new Error(msg.error.message); return msg.result;
  };
  await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'cashew-global-markets', version: '0.1.0' } });
  await post({ jsonrpc: '2.0', method: 'notifications/initialized' });
  return fn(rpc);
}
export async function listTools(url: string, token: string | null, prev: McpTool[] = []): Promise<McpTool[]> {
  return session(url, token, async rpc => {
    const r = await rpc('tools/list');
    return (r.tools || []).slice(0, 100).map((t: any): McpTool => {
      // Only tools the server marks read-only start enabled. Everything else starts off.
      const readOnly = t.annotations?.readOnlyHint === true;
      const old = prev.find(p => p.name === t.name);
      return { name: String(t.name), description: String(t.description || '').slice(0, 300), readOnly, enabled: old ? old.enabled && true : readOnly };
    });
  });
}
export async function callTool(url: string, token: string | null, name: string, args: object) {
  return session(url, token, rpc => rpc('tools/call', { name, arguments: args }));
}
