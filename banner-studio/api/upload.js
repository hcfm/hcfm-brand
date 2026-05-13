// POST /api/upload
// Headers: Authorization: Bearer <session>
// Body: { image: base64-png, target: <ministry-key>, reason: string }
// Commits the new banner image to the brand repo and returns commit info.
import { requireSession } from '../lib/session.js';
import { parsePng } from '../lib/png.js';

// Single source of truth for the six HCFM-family signature targets.
// upload.js, revert.js, and activity.js all reference this shape so the
// list never drifts. Adding a new sub-ministry = one new entry here.
const TARGETS = {
  'parent':           { path: 'email-banners/parent/banner.png',           label: 'HCFM North Easton' },
  'ftp':              { path: 'email-banners/ftp/banner.png',              label: 'Family Theater Productions' },
  'family-rosary':    { path: 'email-banners/family-rosary/banner.png',    label: 'Family Rosary' },
  'catholic-mom':     { path: 'email-banners/catholic-mom/banner.png',     label: 'Catholic Mom' },
  'catholic-central': { path: 'email-banners/catholic-central/banner.png', label: 'Catholic Central' },
  'peyton-institute': { path: 'email-banners/peyton-institute/banner.png', label: 'The Peyton Institute' },
};
const SITE_BASE = 'https://emmanuelepau.github.io/hcfm-brand/';
const MAX_BYTES = 250 * 1024;
const REQUIRED_W = 600;        // Width is fixed (Outlook for Windows clips wider banners at the 600px reading-pane edge)
const MIN_H = 100;             // Below this looks broken at scale
const MAX_H = 200;             // Above this feels spammy on mobile per Litmus/Exclaimer research
const RECOMMENDED_H = 150;     // The modern professional default (4:1 aspect ratio)
const REPO_OWNER = 'EmmanuelEpau';
const REPO_NAME  = 'hcfm-brand';
const BRANCH     = 'main';

async function gh(path, opts = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw Object.assign(new Error('GitHub credential is missing.'), { status: 500, internal: true });
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
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
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

  const { image, target, reason } = req.body || {};
  if (!TARGETS[target]) {
    return res.status(400).json({ error: 'Pick one of the six ministry signatures.' });
  }
  if (typeof image !== 'string' || !image) {
    return res.status(400).json({ error: 'No image was sent. Try dropping it again.' });
  }
  const trimmedReason = (typeof reason === 'string' ? reason : '').trim().slice(0, 140) || '(no reason given)';

  // Decode + validate the PNG server-side (defense in depth)
  const cleaned = image.replace(/^data:image\/png;base64,/, '');
  let buf;
  try { buf = Buffer.from(cleaned, 'base64'); }
  catch { return res.status(400).json({ error: 'The image could not be decoded.' }); }
  if (buf.length > MAX_BYTES) {
    return res.status(400).json({ error: `Image is too large (${(buf.length/1024).toFixed(0)} KB). Limit is ${MAX_BYTES/1024} KB.` });
  }
  const png = parsePng(buf);
  if (!png.ok) return res.status(400).json({ error: png.error });
  if (png.width !== REQUIRED_W) {
    return res.status(400).json({ error: `Image must be exactly ${REQUIRED_W} pixels wide (got ${png.width}). Email clients clip wider banners in Outlook for Windows.` });
  }
  if (png.height < MIN_H) {
    return res.status(400).json({ error: `Image height must be at least ${MIN_H} px (got ${png.height}). ${RECOMMENDED_H} is recommended.` });
  }
  if (png.height > MAX_H) {
    return res.status(400).json({ error: `Image height must be no more than ${MAX_H} px (got ${png.height}). ${RECOMMENDED_H} is recommended.` });
  }

  const { path, label: targetLabel } = TARGETS[target];
  const liveUrl = SITE_BASE + path;

  // 1. Get current SHA for this file (required for PUT)
  let current;
  try { current = await gh(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`); }
  catch (err) {
    if (err.status === 404) {
      // File doesn't exist yet — that's allowed; PUT without SHA creates it
      current = null;
    } else {
      return res.status(502).json({ error: 'Could not read the current banner. Try again in a moment.' });
    }
  }

  // 2. PUT new contents
  const commitMessage = `Banner Studio: ${targetLabel} — ${trimmedReason} (uploaded by ${session.name})`;
  let result;
  try {
    result = await gh(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: commitMessage,
        content: buf.toString('base64'),
        sha: current ? current.sha : undefined,
        branch: BRANCH,
      }),
    });
  } catch (err) {
    if (err.status === 409 || err.status === 422) {
      return res.status(409).json({ error: 'Someone else updated the banner a moment ago. Reload and try again.' });
    }
    if (err.status === 403) {
      return res.status(500).json({ error: 'Studio is not allowed to write right now. Ask Emmy to refresh the GitHub credential.' });
    }
    return res.status(502).json({ error: 'GitHub could not save the banner. Try again in a moment.' });
  }

  return res.status(200).json({
    ok: true,
    sha: result.commit.sha.slice(0, 7),
    bytes: buf.length,
    liveUrl,
    uploader: session.name,
    target,
    targetLabel,
    reason: trimmedReason,
  });
}

// Vercel: bump body parser to comfortably handle a base64-encoded 250KB image (~333KB)
export const config = {
  api: { bodyParser: { sizeLimit: '500kb' } },
};
