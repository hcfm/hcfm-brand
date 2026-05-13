// Lightweight HMAC-signed session tokens. No database needed.
// Token format: base64url(payload).hmacBase64url
// Payload: {n: <name>, e: <unix-seconds-expiry>}
import crypto from 'node:crypto';

const SESSION_HOURS = 14 * 24; // 14 days

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(s) {
  s = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function hmac(secret, data) {
  return b64url(crypto.createHmac('sha256', secret).update(data).digest());
}

export function issueSession(secret, name) {
  if (!secret) throw new Error('SESSION_SECRET not configured');
  const exp = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600;
  const payload = b64url(JSON.stringify({ n: name, e: exp }));
  const sig = hmac(secret, payload);
  return `${payload}.${sig}`;
}

export function verifySession(secret, token) {
  if (!secret || !token || typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = hmac(secret, payload);
  // Constant-time compare
  const a = Buffer.from(expected); const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let claims;
  try { claims = JSON.parse(fromB64url(payload).toString('utf8')); }
  catch { return null; }
  if (!claims || typeof claims.e !== 'number') return null;
  if (claims.e < Math.floor(Date.now() / 1000)) return null;
  return { name: String(claims.n || 'Unknown') };
}

export function requireSession(req) {
  const auth = req.headers.authorization || '';
  const m = /^Bearer\s+(.+)$/.exec(auth);
  if (!m) return null;
  return verifySession(process.env.SESSION_SECRET, m[1]);
}
