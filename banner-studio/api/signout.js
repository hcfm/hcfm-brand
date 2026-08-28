// POST /api/signout
// Clears the Studio session. Returns the Cloudflare Access logout URL so the
// front end can end that session too. Leave that out and signing out then
// pressing the button lets you straight back in with no PIN.
//
// ACCESS_LOGOUT_RETURN_URL is where Access sends people after it destroys the
// session. Cloudflare refuses a returnTo it does not protect, so it holds the
// gate's public /bye page rather than the Studio's own address.
import { clearSessionCookie, clearStateCookie } from '../lib/session.js';

export default async function handler(req, res) {
  clearSessionCookie(res);
  clearStateCookie(res);
  res.setHeader('Cache-Control', 'no-store');

  let logout = null;
  const team = process.env.ACCESS_TEAM_DOMAIN || '';
  const home = process.env.ACCESS_LOGOUT_RETURN_URL || '';
  if (team) {
    logout = `https://${team.replace(/^https?:\/\//, '').replace(/\/+$/, '')}/cdn-cgi/access/logout`;
    if (home) logout += '?returnTo=' + encodeURIComponent(home);
  }
  return res.status(200).json({ ok: true, accessLogout: logout });
}
