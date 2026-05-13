// POST /api/revert
// Headers: Authorization: Bearer <session>
// Body: { sha, target }
//
// Takes the banner file as it existed at <sha> in the repo and re-commits
// it as the current banner for <target>. This is the rollback mechanism
// surfaced as "Revert" buttons in the activity feed.
import { requireSession } from '../lib/session.js';

const PATHS = {
  parent: 'email-banners/parent/banner.png',
  ftp:    'email-banners/ftp/banner.png',
};
const LIVE_URLS = {
  parent: 'https://emmanuelepau.github.io/hcfm-brand/email-banners/parent/banner.png',
  ftp:    'https://emmanuelepau.github.io/hcfm-brand/email-banners/ftp/banner.png',
};
const REPO_OWNER = 'EmmanuelEpau';
const REPO_NAME  = 'hcfm-brand';
const BRANCH     = 'main';

async function gh(path, opts = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw Object.assign(new Error('GitHub credential is missing.'), { status: 500 });
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'hcfm-banner-studio',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    const err = new Error((data && data.message) || `GitHub returned HTTP ${res.status}.`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const session = requireSession(req);
  if (!session) return res.status(401).json({ error: 'Please sign in again.' });

  const { sha, target } = req.body || {};
  if (target !== 'parent' && target !== 'ftp') {
    return res.status(400).json({ error: 'Pick HCFM Parent or Family Theater Productions.' });
  }
  if (typeof sha !== 'string' || !/^[a-f0-9]{7,40}$/i.test(sha)) {
    return res.status(400).json({ error: 'That activity entry isn\'t valid to revert from.' });
  }

  const path = PATHS[target];
  const targetLabel = target === 'parent' ? 'HCFM Parent' : 'Family Theater Productions';

  // 1. Fetch the banner content as it existed at <sha>
  let historical;
  try {
    historical = await gh(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${sha}`);
  } catch (err) {
    if (err.status === 404) {
      return res.status(400).json({ error: 'That version of the banner doesn\'t exist on file. It may have been deleted or rewritten.' });
    }
    return res.status(502).json({ error: 'Could not load that historical banner version.' });
  }
  if (!historical || !historical.content) {
    return res.status(502).json({ error: 'GitHub didn\'t return banner content for that version.' });
  }
  const base64Content = historical.content.replace(/\s+/g, '');

  // 2. Fetch the current SHA for this path (required by Contents API to update)
  let current;
  try {
    current = await gh(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`);
  } catch (err) {
    if (err.status !== 404) {
      return res.status(502).json({ error: 'Could not read the current banner.' });
    }
    current = null;
  }

  if (current && current.sha === historical.sha) {
    return res.status(200).json({ ok: true, noop: true, message: 'This is already the current banner; nothing to revert.' });
  }

  // 3. PUT the historical content as the new current banner
  const commitMessage = `Banner Studio: ${targetLabel} — Revert to ${sha.slice(0,7)} (uploaded by ${session.name})`;
  let result;
  try {
    result = await gh(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        sha: current ? current.sha : undefined,
        branch: BRANCH,
      }),
    });
  } catch (err) {
    if (err.status === 409 || err.status === 422) {
      return res.status(409).json({ error: 'Someone else updated the banner just before you. Reload and try again.' });
    }
    return res.status(502).json({ error: 'GitHub could not save the revert.' });
  }

  // Decode raw size for the client polling
  let bytes = 0;
  try { bytes = Buffer.from(base64Content, 'base64').length; } catch {}

  return res.status(200).json({
    ok: true,
    sha: result.commit.sha.slice(0, 7),
    bytes,
    liveUrl: LIVE_URLS[target],
    uploader: session.name,
    target,
    targetLabel,
    revertedFrom: sha.slice(0, 7),
  });
}
