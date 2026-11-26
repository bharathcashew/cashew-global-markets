import Link from 'next/link';
import { LEGAL } from '@/lib/legal';
export type Section = { h: string; p?: string[]; li?: string[] };
export default function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: Section[] }) {
  return (
    <div className="authbg" style={{ minHeight: '100vh', padding: '32px 16px', ['--c' as any]: '#2563EB', ['--cB' as any]: '#1D4ED8', ['--cT' as any]: '#1D4ED8', ['--cD' as any]: '#7FB0FF' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <nav aria-label="Legal" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24, fontSize: 14 }}>
          <Link href="/signin" style={{ color: 'var(--ac, #1D4ED8)' }}>Back to {LEGAL.product}</Link><Link href="/terms" style={{ color: 'var(--sub)' }}>Terms</Link><Link href="/privacy" style={{ color: 'var(--sub)' }}>Privacy</Link>
        </nav>
        <article className="card" style={{ padding: 32, lineHeight: 1.7 }}>
          <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.4 }}>{title}</h1>
          <p className="mu" style={{ marginTop: 6 }}>Effective {LEGAL.effective}</p>
          <p style={{ marginTop: 16, color: 'var(--sub)' }}>{intro}</p>
          {sections.map(s => (
            <section key={s.h} style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>{s.h}</h2>
              {s.p?.map((t, i) => <p key={i} style={{ marginTop: 10, color: 'var(--sub)' }}>{t}</p>)}
              {s.li && <ul style={{ marginTop: 10, paddingLeft: 22, color: 'var(--sub)' }}>{s.li.map((t, i) => <li key={i} style={{ marginTop: 6 }}>{t}</li>)}</ul>}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
