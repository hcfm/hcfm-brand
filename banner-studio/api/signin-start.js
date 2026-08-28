// GET /api/signin-start
// The gate button goes here. Mints a nonce, keeps it in an httpOnly cookie,
// and sends the person to the Cloudflare Access gate carrying only its hash.
// Cloudflare therefore never sees, and never logs, the value that binds the
// sign-in to this browser.
import { setStateCookie } from '../lib/session.js';
import { newNonce, stateHash } from '../lib/handoff.js';

export default async function handler(req, res) {
  const authUrl = process.env.STUDIO_AUTH_URL;
  if (!authUrl || !process.env.HANDOFF_SECRET || !process.env.SESSION_SECRET) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(500).send('Sign-in is not configured yet. Ask Emmy (eepau@hcfm.org).');
  }
  const nonce = newNonce();
  setStateCookie(res, nonce);
  const url = new URL(authUrl);
  url.searchParams.set('s', stateHash(nonce));
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Location', url.toString());
  return res.status(302).end();
}
