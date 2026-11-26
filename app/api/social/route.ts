import { guard } from '@/lib/auth';
import { store } from '@/lib/store';
import { open } from '@/lib/secret';
import { safeFetch } from '@/lib/safefetch';
import { rateLimit } from '@/lib/ai';

/** Read-only search of recent X posts, using the bearer token the user connected. */
export const GET = guard(async (u, req) => {
  const x = (await store.listConns(u, 'x'))[0];
  if (!x) return Response.json({ error: 'X is not connected', notConnected: true }, { status: 409 });
  rateLimit(u + ':social', 30, 900_000);
  const q = (new URL(req.url).searchParams.get('q') || '$SPY OR $NVDA OR $TSLA').slice(0, 300);
  const base = process.env.X_API_BASE || 'https://api.x.com';
  const r = await safeFetch(`${base}/2/tweets/search/recent?` + new URLSearchParams({ query: `(${q}) -is:retweet lang:en`, max_results: '20', 'tweet.fields': 'created_at,author_id', expansions: 'author_id', 'user.fields': 'username' }), { headers: { authorization: `Bearer ${open(x.secret!)}` } });
  const j = JSON.parse(r.text || '{}');
  if (r.status === 401) return Response.json({ error: 'X rejected the token. Reconnect X.' }, { status: 400 });
  if (r.status === 403) return Response.json({ error: 'Your X API plan does not allow search.' }, { status: 400 });
  if (r.status === 429) return Response.json({ error: 'X rate limit reached. Try again later.' }, { status: 429 });
  if (r.status >= 400) return Response.json({ error: j.detail || j.title || `X returned ${r.status}` }, { status: 400 });
  const users = Object.fromEntries((j.includes?.users || []).map((x: any) => [x.id, x.username]));
  return Response.json({ posts: (j.data || []).map((p: any) => ({ id: p.id, author: users[p.author_id] || 'unknown', text: String(p.text).slice(0, 400), created: p.created_at })) });
});
