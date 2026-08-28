// POST /api/signout
// Clears the Studio session. Returns the Cloudflare Access logout URL so the
// front end can end that session too. Without it, signing out and pressing the
// button signs you straight back in with no PIN, which is not what signing out
// means.
import { clearSessionCookie, clearStateCookie } from '../lib/session.js';

export default async function handler(req, res) {
  clearSessionCookie(res);
  clearStateCookie(res);
  res.setHeader('Cache-Control', 'no-store');

  let logout = null;
  const team = process.env.ACCESS_TEAM_DOMAIN || '';
  const home = process.env.STUDIO_URL || '';
  if (team) {
    logout = `https://${team.replace(/^https?:\/\//, '').replace(/\/+$/, '')}/cdn-cgi/access/logout`;
    if (home) logout += '?returnTo=' + encodeURIComponent(home);
  }
  return res.status(200).json({ ok: true, accessLogout: logout });
}
