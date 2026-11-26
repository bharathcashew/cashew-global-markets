import Anthropic from '@anthropic-ai/sdk';
const hits = new Map<string, number[]>();
export function rateLimit(user: string, max = 10, windowMs = 3600_000) {
  const now = Date.now(); const l = (hits.get(user) || []).filter(t => now - t < windowMs);
  if (l.length >= max) throw new Response(JSON.stringify({ error: 'Too many AI requests. Try again later.' }), { status: 429, headers: { 'content-type': 'application/json' } });
  l.push(now); hits.set(user, l);
}
export async function ask(prompt: string, maxTokens: number) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('AI features are off: ANTHROPIC_API_KEY is not set.');
  const c = new Anthropic();
  const m = await c.messages.create({ model: process.env.AI_MODEL || 'claude-sonnet-5-5', max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] });
  const b = m.content[0]; return b && b.type === 'text' ? b.text : '';
}
