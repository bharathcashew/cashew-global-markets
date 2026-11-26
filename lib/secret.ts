import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
/** AES-256-GCM for stored third-party tokens. The key derives from AUTH_SECRET. */
function key() {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET must be set in production.');
  return scryptSync(s || 'dev-only-secret', 'cgm-connections', 32);
}
export function seal(plain: string): string {
  const iv = randomBytes(12); const c = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map(b => b.toString('base64')).join('.');
}
export function open(sealed: string): string {
  const [iv, tag, enc] = sealed.split('.').map(p => Buffer.from(p, 'base64'));
  const d = createDecipheriv('aes-256-gcm', key(), iv); d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}
