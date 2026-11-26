import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Auth seam. Every API route calls requireUser(). The dev login below signs a cookie
 * with AUTH_SECRET. For production replace getUserId() with a hosted provider's session
 * lookup (Clerk, Auth.js, Better Auth, Auth0) that supports Google, Apple and email.
 * Nothing else in the app needs to change.
 */
const COOKIE = 'cgm_session';
const secret = () => process.env.AUTH_SECRET || 'dev-only-secret';
const sign = (v: string) => createHmac('sha256', secret()).update(v).digest('hex');

export function makeSession(userId: string) { return `${userId}.${sign(userId)}`; }
export const SESSION_COOKIE = COOKIE;

export const CLERK = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export async function getUserId(): Promise<string | null> {
  if (CLERK) { const { auth } = await import('@clerk/nextjs/server'); return (await auth()).userId ?? null; }
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const i = raw.lastIndexOf('.');
  if (i < 1) return null;
  const id = raw.slice(0, i), sig = raw.slice(i + 1);
  const exp = Buffer.from(sign(id)), got = Buffer.from(sig);
  return exp.length === got.length && timingSafeEqual(exp, got) ? id : null;
}
export async function requireUser(): Promise<string> {
  const u = await getUserId();
  if (!u) throw new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
  return u;
}
export function guard(fn: (userId: string, req: Request, ctx: any) => Promise<Response>) {
  return async (req: Request, ctx: any) => {
    try { return await fn(await requireUser(), req, ctx); }
    catch (e) {
      if (e instanceof Response) return e;
      return Response.json({ error: e instanceof Error ? e.message : 'error' }, { status: 400 });
    }
  };
}
