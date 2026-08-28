// GET /api/auth-callback?t=<signed handoff>
// Cloudflare Access has verified who this is. Four things have to hold before
// a session is issued: the signature, the two minute expiry, the state nonce
// in this browser's cookie, and the email domain. Any failure sends the person
// back to the gate with a short reason rather than a JSON page.
import {
  issueSession, setSessionCookie, clearStateCookie, parseCookies,
  emailAllowed, STATE_COOKIE,
} from '../lib/session.js';
import { verifyHandoff, stateHash, sameString } from '../lib/handoff.js';

function back(res, reason) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Location', '/?signin=' + encodeURIComponent(reason));
  return res.status(302).end();
}

export default async function handler(req, res) {
  clearStateCookie(res);
  const token = (req.query && req.query.t) || '';
  const claims = verifyHandoff(process.env.HANDOFF_SECRET, Array.isArray(token) ? token[0] : token);
  if (!claims) return back(res, 'expired');

  const nonce = parseCookies(req)[STATE_COOKIE] || '';
  if (!nonce || !sameString(stateHash(nonce), claims.s)) return back(res, 'restart');

  if (!emailAllowed(claims.email)) return back(res, 'domain');

  let session;
  try { session = issueSession(process.env.SESSION_SECRET, { email: claims.email }); }
  catch { return back(res, 'unconfigured'); }

  setSessionCookie(res, session);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Location', '/');
  return res.status(302).end();
}
