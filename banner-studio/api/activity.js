// GET /api/activity
// Returns the last 5 banner swaps in a sanitized, user-friendly format.
import { requireSession } from '../lib/session.js';

const REPO_OWNER = 'EmmanuelEpau';
const REPO_NAME  = 'hcfm-brand';
const BRANCH     = 'main';

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
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=email-banners&per_page=5&sha=${BRANCH}`,
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
      const fullMsg = (c.commit && c.commit.message) || '';
      const firstLine = fullMsg.split('\n')[0];
      // For Banner Studio commits, parse uploader name from "(uploaded by X)" suffix
      const m = /\(uploaded by (.+)\)\s*$/.exec(firstLine);
      const uploader = m ? m[1] : null;
      const what = m ? firstLine.replace(m[0], '').trim() : firstLine;
      return {
        what,
        uploader,
        when: c.commit.author && c.commit.author.date,
      };
    });
    return res.status(200).json({ items: sanitized });
  } catch (err) {
    return res.status(502).json({ error: 'Could not fetch recent activity.' });
  }
}
