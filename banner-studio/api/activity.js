// GET /api/activity
// Returns the last N banner swaps in a sanitized, user-friendly format
// including the commit sha and the inferred target so the client can render
// a thumbnail and offer a one-click revert.
import { requireSession } from '../lib/session.js';

const REPO_OWNER = 'EmmanuelEpau';
const REPO_NAME  = 'hcfm-brand';
const BRANCH     = 'main';
// 20 lets each of the six ministries' current-live row appear even
// after a busy stretch concentrated on one target.
const MAX_ITEMS  = 20;

// All known ministry identifiers + the labels they go by in commit messages
// (current + legacy). Used for inference when the commit message is the
// only source of truth.
const TARGET_INFERENCE = [
  // key, regexes
  { key: 'parent',           patterns: [/HCFM North Easton/i, /HCFM Parent/i, /Headquarters/i, /email-banners\/parent/i] },
  { key: 'ftp',              patterns: [/Family Theater Productions/i, /\bftp\b/i, /email-banners\/ftp/i] },
  { key: 'family-rosary',    patterns: [/Family Rosary/i, /email-banners\/family-rosary/i] },
  { key: 'catholic-mom',     patterns: [/Catholic Mom/i, /email-banners\/catholic-mom/i] },
  { key: 'catholic-central', patterns: [/Catholic Central/i, /email-banners\/catholic-central/i] },
  { key: 'peyton-institute', patterns: [/Peyton Institute/i, /Peyton/i, /email-banners\/peyton-institute/i] },
];

function inferTargetFromCommit(c) {
  const msg = (c.commit?.message || '').split('\n')[0];
  for (const { key, patterns } of TARGET_INFERENCE) {
    if (patterns.some(re => re.test(msg))) return key;
  }
  // Last resort: 'parent' if message mentions parent path (legacy TEST commits)
  if (/\bparent\b/i.test(msg)) return 'parent';
  return null;
}

// Strip prefixes for a clean "what" line in the activity feed.
const STRIP_PREFIXES = [
  /^Banner Studio:\s*/i,
  /^HCFM North Easton\s*[—-]\s*/i,
  /^HCFM Parent\s*[—-]\s*/i,
  /^Headquarters\s*[—-]\s*/i,
  /^Family Theater Productions\s*[—-]\s*/i,
  /^Family Rosary\s*[—-]\s*/i,
  /^Catholic Mom\s*[—-]\s*/i,
  /^Catholic Central\s*[—-]\s*/i,
  /^The Peyton Institute(?: for Domestic Church Life)?\s*[—-]\s*/i,
  /^Peyton Institute\s*[—-]\s*/i,
];
function cleanWhat(line) {
  let what = line;
  for (const re of STRIP_PREFIXES) what = what.replace(re, '');
  if (!what || /^\(no reason given\)$/i.test(what)) what = '(no reason given)';
  return what;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const session = requireSession(req);
  if (!session) return res.status(401).json({ error: 'Please sign in again.' });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'Studio is missing its GitHub credential.' });

  try {
    const r = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=email-banners&per_page=${MAX_ITEMS}&sha=${BRANCH}`,
      { headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'hcfm-banner-studio',
      } }
    );
    if (!r.ok) return res.status(502).json({ error: 'Could not fetch recent activity.' });
    const commits = await r.json();
    const sanitized = commits.map(c => {
      const fullMsg = c.commit?.message || '';
      const firstLine = fullMsg.split('\n')[0];
      const m = /\(uploaded by (.+)\)\s*$/.exec(firstLine);
      const uploader = m ? m[1] : (c.commit?.author?.name || 'unknown');
      const rawWhat = m ? firstLine.replace(m[0], '').trim() : firstLine;
      return {
        sha: c.sha,
        shaShort: c.sha.slice(0, 7),
        what: cleanWhat(rawWhat),
        uploader,
        when: c.commit?.author?.date || c.commit?.committer?.date,
        target: inferTargetFromCommit(c),
      };
    });
    return res.status(200).json({ items: sanitized });
  } catch (err) {
    return res.status(502).json({ error: 'Could not fetch recent activity.' });
  }
}
