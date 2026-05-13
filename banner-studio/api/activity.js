// GET /api/activity
// Returns the last N banner swaps in a sanitized, user-friendly format
// including the commit sha and the inferred target so the client can render
// a thumbnail and offer a one-click revert.
import { requireSession } from '../lib/session.js';

const REPO_OWNER = 'EmmanuelEpau';
const REPO_NAME  = 'hcfm-brand';
const BRANCH     = 'main';
const MAX_ITEMS  = 10;

function inferTargetFromCommit(c) {
  const msg = (c.commit?.message || '').split('\n')[0];
  if (/HCFM Parent|email-banners\/parent/i.test(msg)) return 'parent';
  if (/Family Theater Productions|email-banners\/ftp/i.test(msg)) return 'ftp';
  if (/\bparent\b/i.test(msg)) return 'parent';
  if (/\bftp\b/i.test(msg)) return 'ftp';
  return null;
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
      // Strip prefixes for a clean "what" line
      let what = m ? firstLine.replace(m[0], '').trim() : firstLine;
      what = what.replace(/^Banner Studio:\s*/i, '');
      what = what.replace(/^HCFM Parent\s*[—-]\s*/i, '');
      what = what.replace(/^Family Theater Productions\s*[—-]\s*/i, '');
      if (!what || /^\(no reason given\)$/i.test(what)) what = '(no reason given)';
      return {
        sha: c.sha,
        shaShort: c.sha.slice(0, 7),
        what,
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
