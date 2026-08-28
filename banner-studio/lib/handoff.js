// The signed handoff between the Cloudflare Access gate and the Studio.
//
// Cloudflare authenticates the person, then hands their verified email back
// here in a token signed with HANDOFF_SECRET, which both sides hold. The token
// lives two minutes and carries the SHA-256 of a nonce that only the signing-in
// browser holds, in an httpOnly cookie. So a captured callback URL is useless:
// it expires almost immediately, and in any other browser the nonce does not
// match.
//
// Token format matches lib/session.js: base64url(payload).hmacBase64url
// Payload: {m: <email>, s: <base64url sha256 of the state nonce>, e: <expiry>}
//
// The Worker side of this is studio-access-gate/_worker.js, which builds the
// same bytes with WebCrypto. Change one, change the other.
import crypto from 'node:crypto';

export const HANDOFF_SECONDS = 120;

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

export function stateHash(nonce) {
  return b64url(crypto.createHash('sha256').update(String(nonce), 'utf8').digest());
}

export function newNonce() {
  return b64url(crypto.randomBytes(32));
}

// Used by the tests, and by nothing in production: the Worker signs for real.
export function signHandoff(secret, email, s, seconds = HANDOFF_SECONDS) {
  const payload = b64url(JSON.stringify({
    m: String(email),
    s: String(s),
    e: Math.floor(Date.now() / 1000) + seconds,
  }));
  return `${payload}.${hmac(secret, payload)}`;
}

// Returns {email, s} or null. Never throws on rubbish input.
export function verifyHandoff(secret, token) {
  if (!secret || !token || typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const a = Buffer.from(hmac(secret, payload));
  const b = Buffer.from(token.slice(dot + 1));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let claims;
  try { claims = JSON.parse(fromB64url(payload).toString('utf8')); }
  catch { return null; }
  if (!claims || typeof claims.e !== 'number' || typeof claims.m !== 'string') return null;
  const now = Math.floor(Date.now() / 1000);
  if (claims.e < now) return null;
  // A token signed with an absurd life is not one of ours.
  if (claims.e > now + HANDOFF_SECONDS + 60) return null;
  if (!claims.m.includes('@')) return null;
  return { email: claims.m.toLowerCase(), s: String(claims.s || '') };
}

// Constant-time string compare that tolerates different lengths.
export function sameString(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
