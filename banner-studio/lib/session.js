// Signed session tokens for the Banner Studio. No database needed.
//
// Token format: base64url(payload).hmacBase64url
// Payload: {n: <display name>, m: <email>, e: <unix-seconds expiry>}
//
// The session lives in an httpOnly Secure SameSite=Lax cookie and lasts 90
// days. It is sliding: /api/me re-issues it on every page load, so anyone who
// opens the Studio is good for another 90 days and is never asked to sign in
// again. Renewal lives there rather than in requireSession because upload.js,
// campaign.js, revert.js and activity.js call requireSession(req) with one
// argument and have no response to set a cookie on. Those four files are not
// touched by this change.
//
// The Authorization header route is gone. Cookies issued under the old sign-in
// carried only {n, e} and still verify until they expire, which is why the
// legacy flag below stays.
import crypto from 'node:crypto';

const SESSION_DAYS = 90;
export const SESSION_COOKIE = 'bs_session';
export const STATE_COOKIE = 'bs_state';

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

// issueSession(secret, 'someone@hcfm.org')
// issueSession(secret, {email, name})
export function issueSession(secret, who) {
  if (!secret) throw new Error('SESSION_SECRET not configured');
  const email = typeof who === 'string' ? who : String((who && who.email) || '');
  const name = (who && who.name) ? String(who.name) : email;
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  const payload = b64url(JSON.stringify({ n: name, m: email, e: exp }));
  return `${payload}.${hmac(secret, payload)}`;
}

export function verifySession(secret, token) {
  if (!secret || !token || typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const a = Buffer.from(hmac(secret, payload));
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let claims;
  try { claims = JSON.parse(fromB64url(payload).toString('utf8')); }
  catch { return null; }
  if (!claims || typeof claims.e !== 'number') return null;
  if (claims.e < Math.floor(Date.now() / 1000)) return null;
  // name is what upload.js, campaign.js, revert.js and activity.js read. It
  // must keep coming back or those four files break.
  return {
    name: String(claims.n || claims.m || 'Unknown'),
    email: claims.m ? String(claims.m) : null,
    legacy: !claims.m,
  };
}

export function parseCookies(req) {
  const out = {};
  const raw = (req && req.headers && req.headers.cookie) || '';
  for (const part of String(raw).split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    if (!k) continue;
    let v = part.slice(eq + 1).trim();
    try { v = decodeURIComponent(v); } catch {}
    out[k] = v;
  }
  return out;
}

// The cookie is the only session. Nothing reads an Authorization header.
export function requireSession(req) {
  const cookies = parseCookies(req);
  return verifySession(process.env.SESSION_SECRET, cookies[SESSION_COOKIE]);
}

function serializeCookie(name, value, { maxAge, httpOnly = true }) {
  const bits = [
    `${name}=${value}`,
    'Path=/',
    'SameSite=Lax',
    'Secure',
    `Max-Age=${maxAge}`,
  ];
  if (httpOnly) bits.push('HttpOnly');
  return bits.join('; ');
}

function appendCookie(res, cookie) {
  const prev = res.getHeader('Set-Cookie');
  const list = !prev ? [] : (Array.isArray(prev) ? prev.slice() : [prev]);
  list.push(cookie);
  res.setHeader('Set-Cookie', list);
}

export function setSessionCookie(res, token) {
  appendCookie(res, serializeCookie(SESSION_COOKIE, token, { maxAge: SESSION_DAYS * 86400 }));
}
export function clearSessionCookie(res) {
  appendCookie(res, serializeCookie(SESSION_COOKIE, '', { maxAge: 0 }));
}
export function setStateCookie(res, value) {
  appendCookie(res, serializeCookie(STATE_COOKIE, value, { maxAge: 600 }));
}
export function clearStateCookie(res) {
  appendCookie(res, serializeCookie(STATE_COOKIE, '', { maxAge: 0 }));
}

// hcfm.org by default. ALLOWED_EMAIL_DOMAINS widens it without a code change.
export function emailAllowed(email) {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS || 'hcfm.org';
  const domains = raw.split(/[,\s]+/).map(d => d.trim().toLowerCase().replace(/^@/, '')).filter(Boolean);
  const at = String(email || '').toLowerCase().lastIndexOf('@');
  if (at === -1) return false;
  const domain = String(email).toLowerCase().slice(at + 1);
  return domains.includes(domain);
}
