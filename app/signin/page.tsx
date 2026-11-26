'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SignIn as ClerkSignIn } from '@clerk/nextjs';
const CLERK = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
export default function SignInPage() {
  if (CLERK) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}><ClerkSignIn routing="hash" fallbackRedirectUrl="/markets" /></div>;
  return <DevSignIn />;
}
function DevSignIn() {
  const r = useRouter(); const [email, setEmail] = useState(''); const [create, setCreate] = useState(false); const [msg, setMsg] = useState('');
  const dev = async () => { const res = await fetch('/api/dev-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) }); if (res.ok) r.push('/markets'); else setMsg((await res.json()).error); };
  const provider = (n: string) => setMsg(`${n} sign-in needs an auth provider configured. See README.`);
  return (
     <div className="authbg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, ['--cB' as any]: '#1D4ED8', ['--c' as any]: '#2563EB', ['--cT' as any]: '#1D4ED8', ['--cD' as any]: '#7FB0FF' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="brand" style={{ padding: 0 }}><span>Cashew Global Markets</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button type="button" className={`tab${create ? '' : ' on'}`} onClick={() => setCreate(false)}>Sign in</button>
          <button type="button" className={`tab${create ? ' on' : ''}`} onClick={() => setCreate(true)}>Create account</button>
        </div>
        <button type="button" className="btn" style={{ minHeight: 48 }} onClick={() => provider('Google')}>Continue with Google</button>
        <button type="button" className="btn" style={{ minHeight: 48 }} onClick={() => provider('Apple')}>Continue with Apple</button>
        <label className="mu" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>Email<input className="in" style={{ height: 48 }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
        <button type="button" className="btn p" style={{ minHeight: 48 }} onClick={dev}>{create ? 'Create account' : 'Sign in'} (development login)</button>
        {msg && <p role="alert" className="mu" style={{ fontSize: 13 }}>{msg}</p>}
        <p className="mu" style={{ fontSize: 12, lineHeight: 1.5 }}>Market data is for information only and is not investment advice. By continuing you agree to the <Link href="/terms" style={{ color: 'var(--ac)' }}>Terms</Link> and <Link href="/privacy" style={{ color: 'var(--ac)' }}>Privacy Policy</Link>.</p>
      </div>
    </div>
  );
}
