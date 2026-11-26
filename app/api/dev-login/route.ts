import { makeSession, SESSION_COOKIE } from '@/lib/auth';
/** Development login only. Disabled in production: use a hosted auth provider there. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_LOGIN !== '1') return Response.json({ error: 'Dev login is disabled. Configure an auth provider.' }, { status: 403 });
  const { email } = await req.json().catch(() => ({}));
  const id = 'dev:' + String(email || 'demo@example.com').toLowerCase().slice(0, 80);
  const res = Response.json({ ok: true });
  res.headers.append('set-cookie', `${SESSION_COOKIE}=${encodeURIComponent(makeSession(id))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  return res;
}
export async function DELETE() {
  const res = Response.json({ ok: true });
  res.headers.append('set-cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0`);
  return res;
}
