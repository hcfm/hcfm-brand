// GET /api/me
// Who is this, and keep them signed in. The page cannot read the session
// cookie, so it asks here at load. This is also where the 90 days slides
// forward, because the four publish endpoints call requireSession(req) with no
// response to set a cookie on and are deliberately not being touched.
//
// The old localStorage sign-in is gone. A cookie issued under it still verifies
// until it expires and comes back here with legacy true and no email on it.
import { requireSession, issueSession, setSessionCookie } from '../lib/session.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const session = requireSession(req);
  if (!session) return res.status(401).json({ signedIn: false });

  try {
    const token = issueSession(process.env.SESSION_SECRET, {
      email: session.email || '',
      name: session.name,
    });
    setSessionCookie(res, token);
  } catch {
    // A missing SESSION_SECRET cannot happen here: requireSession already
    // verified against it. Renewal failing is not a reason to sign anyone out.
  }
  return res.status(200).json({
    signedIn: true,
    name: session.name,
    email: session.email || null,
    legacy: !!session.legacy,
  });
}
