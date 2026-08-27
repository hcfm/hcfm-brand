// POST /api/auth
// Body: { code, name? }            (v2: per-person access codes)
//       { name, password }         (legacy body, still accepted)
// Returns: { token, name } on success,
//          { needName: true } when the shared team password matched but no
//          name came with it (the client then asks for one), or
//          { error } otherwise.
//
// ACCESS_CODES environment variable, set in Vercel:
//   one entry per person, "Name = code", separated by commas or newlines, e.g.
//   ACCESS_CODES="Victoria Hassan = fr-8kq2mz, Emmanuel Epau = ee-7xw31p"
//   Codes must not contain commas, equals signs, or spaces.
// A code identifies its person, so publishes carry the right name with no
// name field to mistype. Revoking one person = deleting one entry, without
// re-issuing anyone else's code. TEAM_PASSWORD keeps working as a fallback
// (with a typed name) until ACCESS_CODES has an entry for everyone, so
// deploying this file before setting the variable locks nobody out.
import crypto from 'node:crypto';
import { issueSession } from '../lib/session.js';

function constantTimeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a), 'utf8').digest();
  const hb = crypto.createHash('sha256').update(String(b), 'utf8').digest();
  return crypto.timingSafeEqual(ha, hb);
}

// "Name = code" entries, separated by commas or newlines. Malformed entries
// are skipped rather than crashing sign-in for everyone.
export function parseAccessCodes(raw) {
  const out = [];
  for (const piece of String(raw || '').split(/[\n,]+/)) {
    const entry = piece.trim();
    if (!entry) continue;
    const eq = entry.indexOf('=');
    if (eq === -1) continue;
    const name = entry.slice(0, eq).trim();
    const code = entry.slice(eq + 1).trim();
    if (name.length < 2 || name.length > 60) continue;
    if (code.length < 4) continue;
    out.push({ name, code });
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const body = req.body || {};
  // v2 clients send { code }; the old client sent { name, password }.
  const code = typeof body.code === 'string' ? body.code : (typeof body.password === 'string' ? body.password : '');
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!code) {
    return res.status(400).json({ error: 'Enter your access code.' });
  }

  const entries = parseAccessCodes(process.env.ACCESS_CODES);
  // Compare against every entry, not just until the first hit, so timing
  // does not narrow down which codes exist.
  let matched = null;
  for (const entry of entries) {
    if (constantTimeEqual(code, entry.code) && !matched) matched = entry;
  }
  if (matched) {
    try {
      const token = issueSession(process.env.SESSION_SECRET, matched.name);
      return res.status(200).json({ token, name: matched.name });
    } catch {
      return res.status(500).json({ error: 'Sign-in is temporarily unavailable. Ask Emmy to check the Studio settings.' });
    }
  }

  // Fallback: the shared team password, which carries no name of its own.
  const team = process.env.TEAM_PASSWORD || '';
  if (team && constantTimeEqual(code, team)) {
    if (!name || name.length < 2 || name.length > 60) {
      return res.status(200).json({ needName: true });
    }
    try {
      const token = issueSession(process.env.SESSION_SECRET, name);
      return res.status(200).json({ token, name });
    } catch {
      return res.status(500).json({ error: 'Sign-in is temporarily unavailable. Ask Emmy to check the Studio settings.' });
    }
  }

  if (!entries.length && !team) {
    return res.status(500).json({ error: 'Studio is not fully configured. Ask Emmy to set the access codes.' });
  }
  return res.status(401).json({ error: "That password does not match. Ask Emmy for the current one." });
}
