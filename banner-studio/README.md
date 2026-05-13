# HCFM Banner Studio (v2 — non-technical)

The web tool used to update the campaign banner on every HCFM email signature — designed so non-technical people (Victoria, FTP team, marketing) can use it without ever knowing what GitHub is.

**Live URL (once deployed to Vercel):** TBD — see "Deploy" below.

---

## What users see

1. Open the studio URL in any browser
2. Enter their name + team password (set by Emmy, distributed once over Slack/Signal)
3. Drop a 600 × 200 PNG
4. Pick **HCFM Parent** or **Family Theater Productions**
5. Type one line of "what is this banner for?"
6. Click **Publish banner**
7. The studio confirms when the new banner is live globally

That's the entire user-facing experience. No GitHub. No tokens. No repositories. No HTML knowledge.

## What happens behind the scenes

```
[Browser]
   → POST /api/auth      (name + team password → session token)
   → POST /api/upload    (image + target + reason)
        → Vercel function validates the session and the image
        → Vercel function commits to email-banners/{target}/banner.png in this repo
        → GitHub Action auto-purges jsDelivr CDN
        → GitHub Pages serves the new image
   → Browser polls the live URL until the new banner is visible, then says "Done."
```

## Deploy (Emmy's one-time setup — 5 minutes)

You only do this once. After it's deployed, you and your team just use the studio URL — no Vercel, no GitHub.

### Step 1 — Generate three values to paste into Vercel (1 min)

```bash
# 1. SESSION_SECRET — random string for signing browser sessions
openssl rand -base64 48

# 2. TEAM_PASSWORD — whatever you want your team to type when they sign in.
#    Make it memorable but non-obvious. Distribute over Slack/Signal, never email.
#    Example: "Easton-2026-Banners" (rotate every 90 days)

# 3. GITHUB_TOKEN — a fine-grained PAT for the bot:
#    https://github.com/settings/personal-access-tokens/new
#      Name: HCFM Banner Studio (server)
#      Expiration: 90 days
#      Repository access: Only select repositories → EmmanuelEpau/hcfm-brand
#      Repository permissions → Contents: Read and write
#    Copy the github_pat_… string.
```

Keep these three values in a notes app for the next step.

### Step 2 — Deploy to Vercel (3 min)

1. Go to **vercel.com** → click **Sign Up** → **Continue with GitHub** → authorize Vercel
   (You're using your existing GitHub account — no new account/password.)
2. On the Vercel dashboard, click **Add New… → Project**
3. Find **`hcfm-brand`** in the list of your GitHub repos → click **Import**
4. On the configure screen, set:
   - **Framework Preset:** Other
   - **Root Directory:** click **Edit** → enter `banner-studio` → check **Include source files outside of the Root Directory in the Build Step** ✗ (leave unchecked)
5. Expand **Environment Variables** and add three:

   | Name | Value |
   |---|---|
   | `GITHUB_TOKEN` | the `github_pat_…` from step 1 |
   | `TEAM_PASSWORD` | the team password you picked |
   | `SESSION_SECRET` | the `openssl rand` output from step 1 |

6. Click **Deploy**
7. Wait ~30 seconds. Vercel gives you a URL like `https://hcfm-brand.vercel.app/` (or similar).

> Note: This is configured (see `vercel.json` → `ignoreCommand`) so Vercel only rebuilds when files in `banner-studio/` change. Day-to-day banner swaps (which only touch `email-banners/`) won't trigger redeploys.

### Step 3 — Test it on yourself (1 min)

1. Open the Vercel URL in a fresh browser tab
2. Enter your name (e.g. "Emmy"), enter the team password
3. Drop a test 600×200 PNG, pick HCFM Parent, type "test" as the reason, click Publish
4. Wait for the green "Done" message
5. Verify the live banner URL shows your test image:
   `https://emmanuelepau.github.io/hcfm-brand/email-banners/parent/banner.png`
6. Swap back to your real banner the same way

### Step 4 — Distribute to your team

Send a short message to Victoria, the FTP team, and marketing:

> "We've got a new tool for updating the banner that's at the bottom of every HCFM email. Open `[your Vercel URL]`, sign in with your name and the team password I'm sending separately, drop your image, hit Publish. That's it.
>
> Banners must be **PNG, exactly 600 × 200 pixels, under 100 KB**. Ask me if you want help making one in Canva."

Send the team password in a different channel (Slack DM, Signal, in-person) than the studio URL.

---

## Admin tasks

### Rotating the team password

When you want to rotate the team password (recommended every 90 days, or whenever someone leaves):

1. Pick a new password
2. Vercel dashboard → your project → **Settings → Environment Variables**
3. Edit `TEAM_PASSWORD` → save → click **Redeploy** on the Production deployment
4. Distribute the new password to your team. Their existing sessions stay valid until they sign out or 14 days pass; new sign-ins need the new password.

### Rotating the GitHub credential

When the `GITHUB_TOKEN` expires (90 days) or you want to swap it:

1. Generate a new fine-grained PAT (same scopes as before)
2. Vercel → **Settings → Environment Variables** → edit `GITHUB_TOKEN` → save → **Redeploy**
3. Revoke the old PAT at github.com/settings/personal-access-tokens

### Auditing who uploaded what

Every upload becomes a Git commit with the message:
`Banner Studio: <target> — <reason> (uploaded by <name>)`

Full history: https://github.com/EmmanuelEpau/hcfm-brand/commits/main/email-banners

The studio also shows the last 5 uploads in its "Recent activity" panel.

### Reverting a bad upload

Two ways, pick whichever is easier in the moment:

- **Via the studio:** ask whoever uploaded the bad banner to upload the right one. Same flow.
- **Via GitHub:** github.com/EmmanuelEpau/hcfm-brand/commits/main/email-banners → click the commit BEFORE the bad one → click the banner file at that commit → **Raw** → save the image → drop it into the studio and re-publish.

### Disabling the studio

Vercel dashboard → project → **Settings → General → Pause Deployment** (or **Delete Project**). The signature templates keep working — they pull from the brand repo directly, not from the studio.

---

## Files

- `index.html` — the studio UI (single file, vanilla HTML/CSS/JS)
- `api/auth.js` — `POST /api/auth` validates name + password, returns a session token
- `api/upload.js` — `POST /api/upload` validates the session + image, commits to GitHub
- `api/activity.js` — `GET /api/activity` returns the last 5 banner swaps
- `lib/session.js` — HMAC-signed session tokens (no database)
- `lib/png.js` — server-side PNG signature + dimension validation
- `vercel.json` — security headers + ignoreCommand
- `package.json` — Node 18+, ESM

## Local development (optional)

```bash
cd banner-studio
npm install -g vercel    # one time
vercel link              # link to your Vercel project
vercel env pull .env.local
vercel dev               # studio at http://localhost:3000
```

## Security notes

- The `GITHUB_TOKEN` is in a Vercel server-side env var. It never reaches the browser.
- Sessions are HMAC-signed and live in browser localStorage for 14 days.
- The team password is checked server-side with a constant-time compare.
- Image dimensions and file size are validated client-side AND server-side.
- Vercel auto-adds HTTPS + HSTS; the studio sets `X-Frame-Options: DENY`.
- Worst-case if the team password leaks: someone with the URL + password uploads a bad banner. Revertible in <2 minutes. No write access to anything else in the repo.

## Relationship to the v1 studio (`banner-upload/`)

The old `banner-upload/index.html` (at the root of this repo, served via GitHub Pages) still works as an Emmy-only fallback — it takes a personal access token directly in the browser. The v2 studio in this folder is the one for non-technical users. Once v2 is deployed and you're comfortable, the v1 page at `banner-upload/index.html` can be replaced with a redirect to the v2 URL.

<!-- Deployed via Vercel -->
