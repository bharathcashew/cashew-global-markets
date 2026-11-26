'use client';
import Shell from '@/components/Shell';
import { Card, Status, post, useApi } from '@/components/ui';
import { getLog, type Fired, type Rule } from '@/components/AlertRunner';
import { getVoice, setVoice, speak, supported } from '@/lib/voice';
import { MARKETS } from '@/lib/universe';
import { POPUP_SOURCES, TV_PRESETS, channelEmbed, youtubeEmbed } from '@/lib/tv';
import { useEffect, useState } from 'react';

function Voice() {
  const [s, setS] = useState({ on: false, voice: '', rate: 1 }); const [voices, setVoices] = useState<string[]>([]); const [sup, setSup] = useState<boolean | null>(null);
  useEffect(() => setSup(supported()), []);
  useEffect(() => { const f = () => setS(getVoice()); f(); window.addEventListener('cgm-voice', f); const v = () => setVoices(speechSynthesis.getVoices().filter(x => x.lang.startsWith('en')).map(x => x.name)); if (supported()) { v(); speechSynthesis.onvoiceschanged = v; } return () => window.removeEventListener('cgm-voice', f); }, []);
  if (sup === null) return <Card title="Voice alerts"><p className="mu">Loading…</p></Card>;
  if (!sup) return <Card title="Voice alerts"><p className="mu">This browser does not support speech. Try Chrome, Edge or Safari.</p></Card>;
  return (
    <Card title="Voice alerts" extra={<button type="button" role="switch" aria-checked={s.on} aria-label="Voice alerts" className={`tg${s.on ? ' on' : ''}`} style={{ cursor: 'pointer' }} onClick={() => { setVoice({ on: !s.on }); if (!s.on) speak('Voice alerts are on.', true); }} />}>
      <p className="mu" style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>When this is on, alerts are read aloud while the app is open. It starts off each time you open the app, because browsers only allow speech after you tap something.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <select className="in" aria-label="Voice" value={s.voice} onChange={e => setVoice({ voice: e.target.value })}><option value="">Default voice</option>{voices.map(v => <option key={v}>{v}</option>)}</select>
        <label className="mu" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>Speed<input type="range" min="0.7" max="1.5" step="0.1" value={s.rate} onChange={e => setVoice({ rate: Number(e.target.value) })} /></label>
        <button className="btn" onClick={() => speak('Sample alert. N V D A is above 180, at 182 dollars and 40 cents.', true)}>Play a test</button>
      </div>
    </Card>
  );
}

const empty = { type: 'price_above', symbol: '', value: '', exchange: MARKETS[0].name };
function Rules() {
  const { data, error, loading, reload } = useApi<{ connections: (Rule & { kind: string })[] }>('/api/connections');
  const [f, setF] = useState(empty); const [err, setErr] = useState(''); const [log, setLog] = useState<Fired[]>([]);
  useEffect(() => { const g = () => setLog(getLog()); g(); window.addEventListener('cgm-alert', g); return () => window.removeEventListener('cgm-alert', g); }, []);
  const rules = (data?.connections || []).filter(c => c.kind === 'alert');
  const market = f.type.startsWith('market_');
  const add = async (e: React.FormEvent) => { e.preventDefault(); try { await post('/api/connections', { kind: 'alert', name: 'alert', config: market ? { type: f.type, exchange: f.exchange } : { type: f.type, symbol: f.symbol, value: f.value } }); setF({ ...empty, type: f.type }); setErr(''); reload(); window.dispatchEvent(new Event('cgm-alerts-changed')); } catch (x: any) { setErr(x.message); } };
  const del = async (id: number) => { await fetch(`/api/connections/${id}`, { method: 'DELETE' }); reload(); window.dispatchEvent(new Event('cgm-alerts-changed')); };
  return (<>
    <Card title="Alert rules">
      <Status loading={loading} error={error} />
      {!loading && !rules.length && <p className="mu">No alerts yet.</p>}
      {rules.map(r => <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 48, borderTop: '1px solid var(--line)', gap: 8 }}><span>{r.name}</span><button className="btn" onClick={() => del(r.id)} aria-label={`Remove ${r.name}`}>Remove</button></div>)}
      <form onSubmit={add} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginTop: 16 }}>
        <select className="in" aria-label="Alert type" value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option value="price_above">Price above</option><option value="price_below">Price below</option><option value="move_pct">Moves by percent</option><option value="market_open">Market opens</option><option value="market_close">Market closes</option></select>
        {market ? <select className="in" aria-label="Exchange" value={f.exchange} onChange={e => setF({ ...f, exchange: e.target.value })}>{MARKETS.map(m => <option key={m.name}>{m.name}</option>)}</select> : <>
          <input className="in" aria-label="Symbol" placeholder="Symbol" value={f.symbol} onChange={e => setF({ ...f, symbol: e.target.value })} />
          <input className="in" aria-label={f.type === 'move_pct' ? 'Percent' : 'Price'} placeholder={f.type === 'move_pct' ? 'Percent, e.g. 2' : 'Price'} inputMode="decimal" value={f.value} onChange={e => setF({ ...f, value: e.target.value })} /></>}
        <button className="btn p" type="submit">Add alert</button>
      </form>
      {err && <p className="dn" role="alert" style={{ marginTop: 8 }}>{err}</p>}
    </Card>
    <Card title="Recent alerts" extra={log.length ? <button className="btn" onClick={() => { try { localStorage.removeItem('cgm_alert_log'); } catch {} setLog([]); }}>Clear</button> : undefined}>
      {!log.length && <p className="mu">Nothing has fired yet. Alerts are checked every minute while the app is open.</p>}
      {log.map((l, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, minHeight: 40, alignItems: 'center', borderTop: '1px solid var(--line)' }}><span>{l.text}</span><span className="mu" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(l.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></div>)}
    </Card>
  </>);
}

function Live() {
  const [src, setSrc] = useState('bloomberg'); const [custom, setCustom] = useState(''); const [applied, setApplied] = useState('');
  const pop = POPUP_SOURCES.find(x => x.id === src); const p = TV_PRESETS.find(x => x.id === src); const embed = p ? channelEmbed(p.channel) : youtubeEmbed(applied);
  return (
    <Card title="Live TV">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {TV_PRESETS.map(t => <button key={t.id} className={`tab${src === t.id ? ' on' : ''}`} onClick={() => setSrc(t.id)}>{t.label}</button>)}
        {POPUP_SOURCES.map(t => <button key={t.id} className={`tab${src === t.id ? ' on' : ''}`} onClick={() => setSrc(t.id)}>{t.label}</button>)}
        <button className={`tab${src === 'custom' ? ' on' : ''}`} onClick={() => setSrc('custom')}>Other YouTube link</button>
      </div>
      {pop && <div style={{ padding: 16, border: '1px solid var(--line)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ lineHeight: 1.6 }}>{pop.label} live TV needs a subscription or a TV provider login. Open it in a small window next to this page and sign in there with your own account.</p>
        <div><button className="btn p" onClick={() => window.open(pop.url, 'cgm-' + pop.id, 'popup,width=560,height=420,noopener,noreferrer')}>Open {pop.label} in a window</button></div>
        <p className="mu" style={{ fontSize: 12, lineHeight: 1.5 }}>You sign in on {pop.label}'s own site. Cashew Global Markets never sees or stores your {pop.label} login. If your browser blocks the window, allow pop-ups for this site.</p>
      </div>}
      {src === 'custom' && <form onSubmit={e => { e.preventDefault(); setApplied(custom); }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}><input className="in" style={{ flex: '1 1 280px' }} aria-label="YouTube link" placeholder="https://www.youtube.com/watch?v=..." value={custom} onChange={e => setCustom(e.target.value)} /><button className="btn p" type="submit">Load</button></form>}
      {src === 'custom' && applied && !embed && <p className="dn" role="alert">That is not a YouTube video link.</p>}
      {pop ? null : embed ? <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 8, overflow: 'hidden', background: '#000' }}><iframe key={embed} src={embed} title={p ? `${p.label} live` : 'Video'} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} /></div> : src !== 'custom' ? null : <p className="mu">Paste a YouTube link to watch it here.</p>}
      {!pop && <p className="mu" style={{ marginTop: 12, fontSize: 12, lineHeight: 1.5 }}>The video starts muted so it doesn't talk over voice alerts. If a channel does not allow embedding, the player shows an error. {p && <>Watch on <a href={p.page} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ac)' }}>{p.label}'s site</a> instead.</>}</p>}
    </Card>
  );
}
export default function Alerts() {
  return (
    <Shell title="Alerts and live TV" sub="Spoken alerts and a news channel in one place">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}><Voice /><Rules /></div>
        <div style={{ flex: '1 1 480px', minWidth: 0 }}><Live /></div>
      </div>
    </Shell>
  );
}
