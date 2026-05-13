// POST /api/auth
// Body: { name, password }
// Returns: { token, name } on success
import { issueSession } from '../lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const { name, password } = req.body || {};
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 60) {
    return res.status(400).json({ error: 'Please enter your name (2–60 characters).' });
  }
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Please enter the team password.' });
  }
  const expected = process.env.TEAM_PASSWORD || '';
  if (!expected) {
    return res.status(500).json({ error: 'Studio is not fully configured. Ask Emmy to set the team password.' });
  }
  // Constant-time compare
  let same = password.length === expected.length;
  let diff = 0;
  const len = Math.max(password.length, expected.length);
  for (let i = 0; i < len; i++) diff |= (password.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  if (!same || diff !== 0) {
    // Avoid leaking timing or hint via different messages
    return res.status(401).json({ error: 'Wrong password. Ask Emmy for the current team password.' });
  }
  try {
    const token = issueSession(process.env.SESSION_SECRET, trimmedName);
    return res.status(200).json({ token, name: trimmedName });
  } catch (err) {
    return res.status(500).json({ error: 'Sign-in is temporarily unavailable. Ask Emmy to check the studio settings.' });
  }
}
