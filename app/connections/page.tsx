'use client';
import Shell from '@/components/Shell';
import { Card, Status, post, useApi } from '@/components/ui';
import { useState } from 'react';
type Tool = { name: string; description: string; readOnly: boolean; enabled: boolean };
type C = { id: number; kind: 'rss' | 'mcp' | 'x'; name: string; url: string | null; hasSecret: boolean; config: { tools?: Tool[] } };

const Toggle = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => <button type="button" role="switch" aria-checked={on} aria-label={label} className={`tg${on ? ' on' : ''}`} onClick={onClick} style={{ cursor: 'pointer' }} />;

function McpCard({ c, reload }: { c: C; reload: () => void }) {
  const [msg, setMsg] = useState(''); const [run, setRun] = useState<{ tool: Tool; args: string } | null>(null); const [out, setOut] = useState(''); const [confirm, setConfirm] = useState(false);
  const patch = async (b: object) => { try { await fetch(`/api/connections/${c.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(async r => { if (!r.ok) throw new Error((await r.json()).error); }); setMsg(''); reload(); } catch (e: any) { setMsg(e.message); } };
  const exec = async () => { if (!run) return; try { const j = await post('/api/mcp/call', { connectionId: c.id, tool: run.tool.name, args: JSON.parse(run.args || '{}'), confirm }); setOut(JSON.stringify(j.result, null, 2).slice(0, 4000)); } catch (e: any) { setOut(e.message); } };
  return (
    <Card title={c.name} extra={<span style={{ display: 'flex', gap: 8 }}><button className="btn" onClick={() => patch({ refresh: true })}>Test connection</button><button className="btn" onClick={async () => { await fetch(`/api/connections/${c.id}`, { method: 'DELETE' }); reload(); }}>Remove</button></span>}>
      <p className="mu" style={{ fontSize: 12, marginBottom: 8, wordBreak: 'break-all' }}>{c.url}</p>
      {(c.config.tools || []).map(t => (
        <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, minHeight: 52, borderTop: '1px solid var(--line)' }}>
          <div style={{ minWidth: 0 }}><b>{t.name}</b> <span className="chip" style={{ marginLeft: 6, color: t.readOnly ? 'var(--up)' : 'var(--warn)' }}>{t.readOnly ? 'Read only' : 'Can change things'}</span><div className="mu" style={{ fontSize: 12 }}>{t.description}</div></div>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{t.enabled && <button className="btn" onClick={() => { setRun({ tool: t, args: '{}' }); setOut(''); setConfirm(false); }}>Run</button>}<Toggle on={t.enabled} label={`${t.enabled ? 'Turn off' : 'Turn on'} ${t.name}`} onClick={() => patch({ tools: { [t.name]: !t.enabled } })} /></span>
        </div>))}
      {run && <div style={{ marginTop: 12, padding: 12, border: '1px solid var(--line)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <b>Run {run.tool.name}</b>
        <textarea className="in" style={{ height: 80, padding: 8, fontFamily: 'ui-monospace,monospace' }} aria-label="Arguments as JSON" value={run.args} onChange={e => setRun({ ...run, args: e.target.value })} />
        {!run.tool.readOnly && <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)} /> I confirm this tool may change things</label>}
        <div style={{ display: 'flex', gap: 8 }}><button className="btn p" onClick={exec}>Run tool</button><button className="btn" onClick={() => setRun(null)}>Close</button></div>
        {out && <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12, maxHeight: 240, overflow: 'auto' }}>{out}</pre>}
      </div>}
      {msg && <p className="dn" role="alert" style={{ marginTop: 8 }}>{msg}</p>}
    </Card>
  );
}

export default function Connections() {
  const { data, error, loading, reload } = useApi<{ connections: C[] }>('/api/connections');
  const [xt, setXt] = useState(''); const [xe, setXe] = useState('');
  const [m, setM] = useState({ name: '', url: '', secret: '' }); const [me, setMe] = useState(''); const [busy, setBusy] = useState(false);
  const list = data?.connections || []; const x = list.find(c => c.kind === 'x'); const mcp = list.filter(c => c.kind === 'mcp');
  const addX = async () => { try { await post('/api/connections', { kind: 'x', name: 'X', secret: xt }); setXt(''); setXe(''); reload(); } catch (e: any) { setXe(e.message); } };
  const addM = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); try { await post('/api/connections', { kind: 'mcp', ...m }); setM({ name: '', url: '', secret: '' }); setMe(''); reload(); } catch (x: any) { setMe(x.message); } setBusy(false); };
  return (
    <Shell title="Connections" sub="Social accounts and external MCP servers">
      <Status loading={loading} error={error} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="X">
            {x ? <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span><span className="dot o" /> Connected</span><button className="btn" onClick={async () => { await fetch(`/api/connections/${x.id}`, { method: 'DELETE' }); reload(); }}>Disconnect</button></div> :
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p className="mu" style={{ fontSize: 13, lineHeight: 1.5 }}>Paste a bearer token from your X developer app. It is stored encrypted and used only to search recent posts. Search needs an X API plan that includes it.</p>
                <input className="in" type="password" aria-label="X bearer token" placeholder="Bearer token" value={xt} onChange={e => setXt(e.target.value)} autoComplete="off" />
                <button className="btn p" onClick={addX}>Connect X</button>{xe && <p className="dn" role="alert" style={{ fontSize: 13 }}>{xe}</p>}
              </div>}
          </Card>
          <Card title="Other accounts"><p className="mu" style={{ lineHeight: 1.5 }}>Reddit, StockTwits and Bluesky are not available yet.</p></Card>
        </div>
        <div style={{ flex: '2 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mcp.map(c => <McpCard key={c.id} c={c} reload={reload} />)}
          <Card title="Add MCP server">
            <form onSubmit={addM} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
              <input className="in" aria-label="Name" placeholder="Name" value={m.name} onChange={e => setM({ ...m, name: e.target.value })} />
              <input className="in" aria-label="Server URL" placeholder="https://example.com/mcp" value={m.url} onChange={e => setM({ ...m, url: e.target.value })} />
              <input className="in" type="password" aria-label="Bearer token (optional)" placeholder="Bearer token (optional)" value={m.secret} onChange={e => setM({ ...m, secret: e.target.value })} autoComplete="off" />
              <button className="btn p" type="submit" disabled={busy}>{busy ? 'Connecting…' : 'Add server'}</button>
            </form>
            {me && <p className="dn" role="alert" style={{ marginTop: 8, fontSize: 13 }}>{me}</p>}
            <p className="mu" style={{ marginTop: 12, fontSize: 12, lineHeight: 1.5 }}>Streamable HTTP servers only. Only tools the server marks read-only start on. Any tool that can change things starts off and asks for confirmation on every run.</p>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
