import { NextResponse, type NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublic = createRouteMatcher(['/signin(.*)', '/terms', '/privacy', '/api/health']);
const clerk = clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect();
  if (req.nextUrl.pathname === '/') return NextResponse.redirect(new URL('/markets', req.url));
});

// Development gate: pages need a session cookie. API routes verify its signature.
function dev(req: NextRequest) {
  const has = req.cookies.get('cgm_session')?.value;
  const p = req.nextUrl.pathname;
  if (p.startsWith('/api')) return NextResponse.next();
  if (!has && !p.startsWith('/signin') && p !== '/terms' && p !== '/privacy') return NextResponse.redirect(new URL('/signin', req.url));
  if (has && p === '/') return NextResponse.redirect(new URL('/markets', req.url));
  return NextResponse.next();
}
export default process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? clerk : dev;
export const config = { matcher: ['/((?!_next|.*\\..*).*)', '/(api|trpc)(.*)'] };
