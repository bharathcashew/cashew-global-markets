'use client';
import Shell from '@/components/Shell';
import { Card, Status } from '@/components/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';
type P = { id: string; author: string; text: string; created: string };
export default function Social() {
  const [q, setQ] = useState('$SPY OR $NVDA OR $TSLA'); const [posts, setPosts] = useState<P[]>([]); const [err, setErr] = useState<string | null>(null); const [loading, setLoading] = useState(false); const [off, setOff] = useState(false);
  const load = async (query = q) => { setLoading(true); setErr(null); try { const r = await fetch('/api/social?q=' + encodeURIComponent(query)); const j = await r.json(); if (j.notConnected) { setOff(true); setPosts([]); } else if (!r.ok) throw new Error(j.error); else { setOff(false); setPosts(j.posts); } } catch (e: any) { setErr(e.message); } setLoading(false); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  return (
    <Shell title="Social" sub="Market posts from X">
      {off && <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', borderColor: 'var(--ac)' }}><div><b>Connect X to see financial posts</b><p className="mu" style={{ marginTop: 4 }}>Posts are read only. Nothing is posted for you.</p></div><Link href="/connections" className="btn p" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>Connect X</Link></div>}
      <form onSubmit={e => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input className="in" style={{ flex: '1 1 300px' }} aria-label="Search" value={q} onChange={e => setQ(e.target.value)} placeholder="$NVDA OR $AMD" />
        <button className="btn p" type="submit" disabled={loading || off}>Search</button>
      </form>
      <Status loading={false} error={err} />
      <Card title="Feed">
        {loading && <p className="mu">Loading…</p>}
        {!loading && !posts.length && !off && !err && <p className="mu">No posts found for that search.</p>}
        {posts.map(p => <article key={p.id} style={{ padding: '14px 0', borderTop: '1px solid var(--line)' }}><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><b>@{p.author}</b><span className="mu" style={{ fontSize: 12 }}>{new Date(p.created).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span><a href={`https://x.com/i/web/status/${p.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--ac)', marginLeft: 'auto' }}>Open on X</a></div><p style={{ marginTop: 8, lineHeight: 1.5, color: 'var(--sub)' }}>{p.text}</p></article>)}
      </Card>
    </Shell>
  );
}
