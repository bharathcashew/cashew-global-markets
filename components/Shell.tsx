'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

const icons: Record<string, string> = { map: 'M9 1.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 1 0 0-15M1.5 9h15M9 1.5c2.5 2 2.5 13 0 15M9 1.5c-2.5 2-2.5 13 0 15', heat: 'M2 2h6v6H2zM10 2h6v6h-6zM2 10h6v6H2zM10 10h6v6h-6z', port: 'M9 1.5l6.5 3.75v7.5L9 16.5l-6.5-3.75v-7.5z', ana: 'M1.5 9h3l2-5.5 3 11 2-5.5h5', pnl: 'M3.5 3h11a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 2 14.5v-10A1.5 1.5 0 0 1 3.5 3zM2 7h14M6 1.5v3M12 1.5v3', cry: 'M9 1.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 1 0 0-15M7 5.5h3a1.5 1.5 0 0 1 0 3H7zM7 8.5h3.5a1.5 1.5 0 0 1 0 3H7z', jou: 'M4 2h7l3 3v11H4zM11 2v3h3M6.5 9h5M6.5 12h5', vol: 'M1.5 11l3-5 3 4 3-7 3 9 2-3', news: 'M3.5 3h8a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 2 13.5v-9A1.5 1.5 0 0 1 3.5 3zM13 6h3v7.5a1.5 1.5 0 0 1-1.5 1.5M5 6.5h5M5 9h5M5 11.5h3', soc: 'M2 3.5h14v9H8l-3.5 3v-3H2z', bell: 'M9 2a4.5 4.5 0 0 0-4.5 4.5c0 4-1.5 5-1.5 5h12s-1.5-1-1.5-5A4.5 4.5 0 0 0 9 2zM7.5 14.5a1.5 1.5 0 0 0 3 0', con: 'M6 2v4M12 2v4M4.5 6h9v3a4.5 4.5 0 0 1-9 0zM9 13.5V16.5' };
// [color, button shade, text on tint (light), text on tint (dark)]
const HUE: Record<string, string[]> = {
  '/markets': ['#2563EB', '#1D4ED8', '#1D4ED8', '#7FB0FF'], '/heatmap': ['#EA580C', '#C2410C', '#C2410C', '#FDBA74'], '/portfolio': ['#7C3AED', '#6D28D9', '#6D28D9', '#C4B5FD'],
  '/analysis': ['#0D9488', '#0F766E', '#0F766E', '#5EEAD4'], '/pnl': ['#0891B2', '#0E7490', '#0E7490', '#67E8F9'], '/crypto': ['#D97706', '#B45309', '#B45309', '#FCD34D'],
  '/journal': ['#DB2777', '#BE185D', '#BE185D', '#F9A8D4'], '/volatility': ['#4F46E5', '#4338CA', '#4338CA', '#A5B4FC'], '/news': ['#0284C7', '#0369A1', '#0369A1', '#7DD3FC'],
  '/social': ['#C026D3', '#A21CAF', '#A21CAF', '#F0ABFC'], '/alerts': ['#E11D48', '#BE123C', '#BE123C', '#FDA4AF'], '/connections': ['#65A30D', '#4D7C0F', '#4D7C0F', '#BEF264'],
};
const hue = (h: string): React.CSSProperties => { const v = HUE[h] || HUE['/markets']; return { ['--c' as any]: v[0], ['--cB' as any]: v[1], ['--cT' as any]: v[2], ['--cD' as any]: v[3] }; };
const NAV = [['World markets', '/markets', 'map'], ['Heatmap', '/heatmap', 'heat'], ['Portfolio', '/portfolio', 'port'], ['Analysis', '/analysis', 'ana'], ['P&L tracker', '/pnl', 'pnl'], ['Crypto', '/crypto', 'cry'], ['Trade journal', '/journal', 'jou'], ['Volatility', '/volatility', 'vol'], ['News', '/news', 'news'], ['Social', '/social', 'soc'], ['Alerts & live TV', '/alerts', 'bell'], ['Connections', '/connections', 'con']];

import { useClerk } from '@clerk/nextjs';
import AlertRunner from './AlertRunner';
import { getVoice, setVoice, speak, supported } from '@/lib/voice';
const CLERK = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
function ClerkOut() { const { signOut } = useClerk(); return <button type="button" className="btn mu" style={{ border: 0 }} onClick={() => signOut({ redirectUrl: '/signin' })}>Sign out</button>; }
export default function Shell({ title, sub, chip, children }: { title: string; sub?: string; chip?: ReactNode; children: ReactNode }) {
  const path = usePathname(); const router = useRouter();
  const [dark, setDark] = useState(false); const [vOn, setVOn] = useState(false); const [sup, setSup] = useState(false);
  useEffect(() => { setSup(supported()); }, []);
  useEffect(() => { const f = () => setVOn(getVoice().on); window.addEventListener('cgm-voice', f); return () => window.removeEventListener('cgm-voice', f); }, []);
  useEffect(() => { setDark(document.documentElement.dataset.theme === 'dark'); }, []);
  const toggle = () => { const t = dark ? 'light' : 'dark'; document.documentElement.dataset.theme = t; try { localStorage.setItem('cgm_theme', t); } catch {} setDark(!dark); };
  const out = async () => { await fetch('/api/dev-login', { method: 'DELETE' }); router.push('/signin'); };
  return (
    <div className="shell" style={hue(path)}>
      <aside className="rail">
        <div className="brand"><svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><rect x="4" y="15" width="5" height="9" rx="1.5" fill="#0D9488" /><rect x="11" y="9" width="5" height="15" rx="1.5" fill="#7C3AED" /><rect x="18" y="4" width="5" height="20" rx="1.5" fill="#DB2777" /></svg><span>Cashew Global Markets</span></div>
        <nav aria-label="Pages" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(([l, h, i]) => (<Link key={h} href={h} style={hue(h)} className={`ni${path === h ? ' on' : ''}`} aria-current={path === h ? 'page' : undefined}><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[i]} /></svg>{l}</Link>))}
        </nav>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sup && <button type="button" className="btn" aria-pressed={vOn} onClick={() => { const n = !vOn; setVoice({ on: n }); if (n) speak('Voice alerts are on.', true); }}>{vOn ? 'Voice alerts: on' : 'Voice alerts: off'}</button>}
          <button type="button" className="btn" aria-pressed={dark} onClick={toggle}>{dark ? 'Switch to light mode' : 'Switch to dark mode'}</button>
          {CLERK ? <ClerkOut /> : <button type="button" className="btn mu" style={{ border: 0 }} onClick={out}>Sign out</button>}
        </div>
      </aside>
      <AlertRunner />
      <main className="main">
        <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div><h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.3 }}>{title}</h1>{sub && <p className="mu" style={{ marginTop: 4 }}>{sub}</p>}</div>{chip}
        </header>
        {children}
        <p className="mu" style={{ fontSize: 12 }}>For information only. Not investment advice. <Link href="/terms" style={{ color: 'inherit' }}>Terms</Link> · <Link href="/privacy" style={{ color: 'inherit' }}>Privacy</Link></p>
      </main>
    </div>
  );
}
