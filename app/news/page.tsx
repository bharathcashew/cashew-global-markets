'use client';
import Shell from '@/components/Shell';
import { Card, Status, post, useApi } from '@/components/ui';
import { useState } from 'react';
type H = { title: string; link: string; source: string; date: string | null };
type C = { id: number; kind: string; name: string; url: string };
export default function News() {
  const news = useApi<{ headlines: H[]; errors: string[]; sources: number }>('/api/news'); const conns = useApi<{ connections: C[] }>('/api/connections');
  const [f, setF] = useState({ name: '', url: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const feeds = (conns.data?.connections || []).filter(c => c.kind === 'rss');
  const add = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); try { await post('/api/connections', { kind: 'rss', ...f }); setF({ name: '', url: '' }); setErr(''); conns.reload(); news.reload(); } catch (x: any) { setErr(x.message); } setBusy(false); };
  const del = async (id: number) => { await fetch(`/api/connections/${id}`, { method: 'DELETE' }); conns.reload(); news.reload(); };
  return (
    <Shell title="News" sub="Headlines from the feeds you add">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: '3 1 460px', minWidth: 0 }}>
          <Card title="Headlines">
            <Status loading={news.loading} error={news.error} />
            {news.data?.errors.map(e => <p key={e} className="dn" role="alert" style={{ fontSize: 13 }}>{e}</p>)}
            {!news.loading && !news.data?.headlines.length && <p className="mu">{feeds.length ? 'No headlines found in your feeds.' : 'Add an RSS or Atom feed URL to see headlines here.'}</p>}
            {news.data?.headlines.map((h, i) => (
              <article key={i} style={{ padding: '12px 0', borderTop: '1px solid var(--line)' }}>
                <a href={h.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink)', fontWeight: 500, textDecoration: 'none' }}>{h.title}</a>
                <div className="mu" style={{ fontSize: 12, marginTop: 4 }}>{h.source}{h.date && Date.parse(h.date) ? ` · ${new Date(h.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}</div>
              </article>
            ))}
          </Card>
        </div>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card title="Sources">
            {feeds.map(s => <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, borderTop: '1px solid var(--line)', gap: 8 }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span><button className="btn" onClick={() => del(s.id)} aria-label={`Remove ${s.name}`}>Remove</button></div>)}
            <form onSubmit={add} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <input className="in" aria-label="Source name" placeholder="Name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
              <input className="in" aria-label="Feed URL" placeholder="https://example.com/feed.xml" value={f.url} onChange={e => setF({ ...f, url: e.target.value })} />
              <button className="btn p" type="submit" disabled={busy}>{busy ? 'Checking…' : 'Add source'}</button>
            </form>
            {err && <p className="dn" role="alert" style={{ marginTop: 8, fontSize: 13 }}>{err}</p>}
            <p className="mu" style={{ marginTop: 12, fontSize: 12 }}>Only headlines and links are shown. Articles open on the publisher's site.</p>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
