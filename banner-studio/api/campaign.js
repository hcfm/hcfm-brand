// GET  /api/campaign?target=<key>   -> current destination/campaign/end date for one ministry
// POST /api/campaign                -> updates where that ministry's banner click lands
// Headers: Authorization: Bearer <session>
// Body (POST): { target, destination, campaign, end_date, reason }
//
// Edits email-banners/campaigns.yml, touching only the block for <target>.
// The existing build-go-pages GitHub Action rebuilds the six go/<key>/
// redirect pages on every push to this file, so nothing here talks to the
// go/ pages directly and no installed signature is ever touched. The banner
// image itself is untouched too; see upload.js for that half of Studio.
import { requireSession } from '../lib/session.js';

// Mirror of TARGETS in upload.js/revert.js — see the note there on why this
// list is duplicated instead of shared.
const TARGETS = {
  'parent':           { label: 'HCFM North Easton' },
  'ftp':              { label: 'Family Theater Productions' },
  'family-rosary':    { label: 'Family Rosary' },
  'catholic-mom':     { label: 'Catholic Mom' },
  'catholic-central': { label: 'Catholic Central' },
  'peyton-institute': { label: 'The Peyton Institute' },
};
const MANIFEST_PATH = 'email-banners/campaigns.yml';
const REPO_OWNER = 'hcfm';
const REPO_NAME  = 'hcfm-brand';
const BRANCH     = 'main';
const CAMPAIGN_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

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
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) {
    const err = new Error((data && data.message) || `GitHub returned HTTP ${res.status}.`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Minimal reader for this one file's shape only: top-level "key:" blocks,
// each followed by indented "field: value" lines. Mirrors the parser in
// .github/workflows/build-go-pages.yml so both sides read the file the
// same way.
function readManifest(text) {
  const out = {};
  let key = null;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^[ \t]/.test(line)) {
      key = line.split(':')[0].trim();
      out[key] = {};
    } else if (key) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      out[key][k] = v;
    }
  }
  return out;
}

// Rewrites one field inside one ministry's block, leaving every other line
// (comments, every other ministry, this ministry's own label) untouched
// character for character. Fails loudly instead of guessing if the field
// isn't found where expected, so a shape mismatch never gets silently
// papered over.
function writeField(text, target, field, value) {
  const blockRe = new RegExp(`(^${target}:\\n(?:[ \\t].*\\n?)*)`, 'm');
  const blockMatch = blockRe.exec(text);
  if (!blockMatch) throw new Error(`No "${target}:" block found in campaigns.yml.`);
  const block = blockMatch[1];
  const lineRe = new RegExp(`^([ \\t]*${field}:[ \\t]*).*$`, 'm');
  if (!lineRe.test(block)) throw new Error(`No "${field}:" line under "${target}:" in campaigns.yml.`);
  const newBlock = block.replace(lineRe, (_m, prefix) => `${prefix}${value}`);
  return text.slice(0, blockMatch.index) + newBlock + text.slice(blockMatch.index + block.length);
}

export default async function handler(req, res) {
  const session = requireSession(req);
  if (!session) return res.status(401).json({ error: 'Please sign in again.' });

  if (req.method === 'GET') {
    const target = req.query && req.query.target;
    if (!TARGETS[target]) return res.status(400).json({ error: 'Pick one of the six ministry signatures.' });
    let file;
    try { file = await gh(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${MANIFEST_PATH}?ref=${BRANCH}`); }
    catch { return res.status(502).json({ error: 'Could not read campaigns.yml.' }); }
    const text = Buffer.from(file.content, 'base64').toString('utf-8');
    const manifest = readManifest(text);
    const entry = manifest[target];
    if (!entry) return res.status(502).json({ error: `campaigns.yml has no "${target}:" block. Ask Emmy to check the file directly.` });
    return res.status(200).json({
      target,
      targetLabel: TARGETS[target].label,
      destination: entry.destination || '',
      campaign: entry.campaign || '',
      end_date: entry.end_date || '',
      review_date: entry.review_date || '',
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { target, destination, campaign, end_date, reason } = req.body || {};
  if (!TARGETS[target]) return res.status(400).json({ error: 'Pick one of the six ministry signatures.' });

  const dest = (typeof destination === 'string' ? destination : '').trim();
  if (!/^https:\/\/.+/.test(dest)) {
    return res.status(400).json({ error: 'Destination must start with https:// and be a real page.' });
  }
  const camp = (typeof campaign === 'string' ? campaign : '').trim();
  if (!CAMPAIGN_RE.test(camp)) {
    return res.status(400).json({ error: 'Campaign name must be lowercase letters, numbers, and hyphens only, e.g. global-rosary-peace-2026.' });
  }
  const end = (typeof end_date === 'string' ? end_date : '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return res.status(400).json({ error: 'Last correct date must be in YYYY-MM-DD form.' });
  }
  const todayIso = new Date().toISOString().slice(0, 10);
  if (end < todayIso) {
    return res.status(400).json({
      error: `That date (${end}) is already in the past. This field is the guardrail that stops a banner ` +
             `advertising an event that already happened, so it can't be backdated here. If you mean to take ` +
             `a banner offline on purpose, ask Emmy to edit campaigns.yml directly.`,
    });
  }

  const { label: targetLabel } = TARGETS[target];
  const trimmedReason = (typeof reason === 'string' ? reason.trim() : '').slice(0, 140)
    || `now points at ${dest}, through ${end}`;

  let file;
  try { file = await gh(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${MANIFEST_PATH}?ref=${BRANCH}`); }
  catch { return res.status(502).json({ error: 'Could not read campaigns.yml.' }); }
  let text = Buffer.from(file.content, 'base64').toString('utf-8');

  try {
    text = writeField(text, target, 'destination', dest);
    text = writeField(text, target, 'campaign', camp);
    text = writeField(text, target, 'end_date', end);
  } catch (err) {
    return res.status(500).json({ error: `campaigns.yml did not match the expected shape: ${err.message} Nothing was changed. Ask Emmy to check the file.` });
  }

  // Prefixed "link:" so the activity feed can tell a destination change from an
  // image change. They live in the same folder and would otherwise be
  // indistinguishable, which is how a link edit ended up showing a Revert
  // button that reverts an image nobody touched.
  const commitMessage = `Banner Studio link: ${targetLabel} - ${trimmedReason} (uploaded by ${session.name})`;
  let result;
  try {
    result = await gh(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${MANIFEST_PATH}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(text, 'utf-8').toString('base64'),
        sha: file.sha,
        branch: BRANCH,
      }),
    });
  } catch (err) {
    if (err.status === 409 || err.status === 422) {
      return res.status(409).json({ error: 'Someone else edited campaigns.yml a moment ago. Reload and try again.' });
    }
    if (err.status === 403) {
      return res.status(500).json({ error: "Studio is not allowed to write right now. Ask Emmy to refresh the GitHub credential." });
    }
    return res.status(502).json({ error: 'GitHub could not save campaigns.yml. Try again in a moment.' });
  }

  return res.status(200).json({
    ok: true,
    sha: result.commit.sha.slice(0, 7),
    target,
    targetLabel,
    destination: dest,
    campaign: camp,
    end_date: end,
    reason: trimmedReason,
  });
}
