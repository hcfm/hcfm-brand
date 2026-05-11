# GitHub Auto-Sync Setup, One-Time Configuration

**What this does:** Replaces the manual `npx @hubspot/cli cms upload` command with automatic deployment. After setup, every `git push` to the `main` branch automatically pushes changes to HubSpot.

**Result:** Edit locally → `git commit` → `git push` → live in HubSpot within ~2 minutes. No CLI command needed.

**Time to set up:** 30-45 minutes. One-time.

**Who runs this:** Emmanuel (currently), or whoever holds Super Admin access to the HubSpot account AND the GitHub repository.

---

## Why do this?

| Without auto-sync (current) | With auto-sync |
|---|---|
| Edit locally → run `npx @hubspot/cli cms upload …` → commit + push | Edit locally → commit + push → done |
| One manual step per change | Zero manual steps |
| Easy to forget the upload step | Can't forget, git push is the action |
| Code in git can be out of sync with HubSpot | They stay in lockstep |
| If a developer joins the team, they need CLI setup | They just need git access |

It's not strictly necessary, the manual workflow works fine. But it removes friction and a class of "forgot to upload" bugs.

---

## Two approaches, pick one

### Approach A: HubSpot's official CMS GitHub integration (recommended)

HubSpot has a built-in feature that connects a GitHub repository to a HubSpot account and auto-deploys on push. Native, supported, free.

**Pros:** Official, supported by HubSpot, no third-party services.
**Cons:** Requires the repo to be in a specific structure HubSpot expects. May require some restructure.

### Approach B: GitHub Actions running HubSpot CLI

A GitHub Actions workflow (a YAML file in `.github/workflows/`) that runs on every push to `main` and executes the `hs cms upload` command using a stored access token.

**Pros:** Full control, identical to manual workflow, supports any repo structure.
**Cons:** Requires managing a GitHub Actions secret with the access token.

**Recommended for HCFM:** Approach B (GitHub Actions). It mirrors exactly what Emmanuel does manually today, just automated. It's safer because we already understand the manual workflow, automation just runs the same commands.

The rest of this guide is for Approach B.

---

## Approach B, Step-by-step setup

### Step 1: Verify the repo structure

You should already have this. The repo at `github.com/EmmanuelEpau/hcfm-brand` should have:

```
hcfm-brand/
├── theme/
│   └── _hcfm-brand-portal/      ← the theme
├── scripts/                       ← helper scripts
├── docs/                          ← this documentation
├── hubspot.config.yml             ← LOCAL ONLY (gitignored)
└── .gitignore
```

The `hubspot.config.yml` contains access keys and **must remain in `.gitignore`**. We'll use a GitHub secret instead for the auto-sync.

### Step 2: Generate a HubSpot Personal Access Key for the auto-sync

This will be used only by GitHub Actions, separate from Emmanuel's personal CLI use.

1. Sign in to HubSpot.
2. Click your profile icon (top right) → **Profile & Preferences**.
3. In the left sidebar, click **Integrations** → **Personal Access Keys**.
4. Click **Create personal access key**.
5. Name it: `GitHub Actions, Brand Portal Deploy`
6. Permissions to enable:
   - ✅ CMS → Source code: **Write**
   - ✅ CMS → HubDB: **Write** (so the chatbot push scripts can run if needed)
   - ✅ Files: **Write** (for the File Manager uploads)
7. Click **Create personal access key**.
8. **Copy the key immediately**, HubSpot only shows it once. Paste somewhere safe (we'll use it in the next step).

### Step 3: Add the key as a GitHub Actions secret

1. Go to the repo: https://github.com/EmmanuelEpau/hcfm-brand
2. Click **Settings** (top of the repo nav).
3. Left sidebar → **Secrets and variables** → **Actions**.
4. Click **New repository secret**.
5. Name: `HUBSPOT_PERSONAL_ACCESS_KEY`
6. Value: paste the key from Step 2.
7. Click **Add secret**.

Now GitHub can use this key during automated builds without it ever being in the public repo.

### Step 4: Add the GitHub Actions workflow file

In the repo, create a new file at `.github/workflows/deploy-to-hubspot.yml` with this content:

```yaml
name: Deploy to HubSpot

on:
  push:
    branches:
      - main
    paths:
      - 'theme/**'   # only run when theme files change

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install HubSpot CLI
        run: npm install -g @hubspot/cli

      - name: Initialize HubSpot config
        run: |
          cat > hubspot.config.yml << EOF
          defaultAccount: brand-portal
          accounts:
            - name: brand-portal
              accountId: 275132
              authType: personalaccesskey
              personalAccessKey: ${{ secrets.HUBSPOT_PERSONAL_ACCESS_KEY }}
          EOF

      - name: Upload theme to HubSpot
        run: hs cms upload theme/_hcfm-brand-portal _hcfm-brand-portal --account=brand-portal

      - name: Cleanup
        if: always()
        run: rm -f hubspot.config.yml
```

### Step 5: Test it

1. Make a small change locally (e.g., edit a typo in a copy block).
2. Commit and push to `main`:
   ```bash
   git add -A
   git commit -m "Test: GitHub auto-sync"
   git push origin main
   ```
3. Open the repo in your browser, click **Actions** tab.
4. You should see a new workflow run starting.
5. Click it to watch progress (~2 minutes total).
6. When it shows green ✅, verify the change appears at hcfm.org/brand.

### Step 6: (Optional but recommended) Add a branch protection rule

Once auto-sync is live, you may want to prevent accidental pushes to `main`:

1. Settings → **Branches** → **Add rule**.
2. Branch name pattern: `main`
3. Enable: ✅ Require a pull request before merging
4. Enable: ✅ Require approvals (at least 1 reviewer)

This ensures that no change is deployed to HubSpot without at least one human review.

---

## What changes after setup

### Before
```bash
# Edit files locally
git add -A
git commit -m "Update copy"
git push origin main
npx @hubspot/cli cms upload theme/_hcfm-brand-portal _hcfm-brand-portal --account=brand-portal
# Wait, verify
```

### After
```bash
# Edit files locally
git add -A
git commit -m "Update copy"
git push origin main
# Auto-deploy happens. Wait, verify.
```

### When deploys happen
- Only on push to `main` branch
- Only when files in `theme/**` change
- Other files (docs, scripts) don't trigger deploys

---

## How to monitor deploys

### See deploy status

Every push that triggers a deploy creates a "Deploy to HubSpot" run under the **Actions** tab in the GitHub repo.

- ✅ Green check = deployed successfully
- ❌ Red X = deploy failed; click for logs

### Email notifications

GitHub will email the repo owner on failed runs by default. To customize: GitHub Settings → Notifications.

### Audit trail

Each Actions run logs exactly what was deployed and the result. Combined with git commit history, you have a complete record.

---

## How to roll back

### Roll back the latest deploy

```bash
git revert HEAD
git push origin main
```

This creates a new commit that undoes the previous one. The auto-sync runs, deploying the reverted state. ~2 minutes to live.

### Roll back a specific past commit

```bash
git revert <commit-id>
git push origin main
```

### Roll back via HubSpot directly (faster but no git trail)

1. Open Design Manager → file in question
2. Click "View history" → choose an earlier revision → Restore

This is faster but DOESN'T update the git repo, so the next push to `main` will overwrite this rollback. Always prefer `git revert`.

---

## Troubleshooting

### "Deploy failed, invalid access token"

The personal access key may have expired or been revoked.
1. Generate a new one (Step 2 above).
2. Update the GitHub secret with the new key.
3. Re-trigger the deploy by pushing again.

### "Deploy succeeded but page didn't update"

HubSpot's CDN can cache for up to 1-2 minutes. Wait, then hard-refresh (Ctrl+Shift+R / Cmd+Shift+R).

If still not updated after 5 minutes, the deploy may have uploaded but not affected the right files. Check the Actions log.

### "Deploy ran but I see errors in the log"

Check which file caused the error. Common causes:
- HubL template syntax error
- Missing closing tag in HTML
- CSS syntax error

The HubSpot CLI logs the specific error. Fix locally, commit, push again.

---

## Cost

Free. GitHub Actions has a generous free tier (2,000 minutes/month for private repos), and a typical deploy uses ~2 minutes. Even with daily deploys, monthly usage is well under the free limit.

---

## Security considerations

- The `HUBSPOT_PERSONAL_ACCESS_KEY` is stored as a GitHub repository secret, encrypted at rest, only accessible to workflow runs, never exposed in logs.
- The key has the **minimum permissions necessary** (CMS write, HubDB write, Files write). Not Marketing or CRM scopes.
- If the key is ever compromised, rotate it: generate a new one, update the GitHub secret, revoke the old one in HubSpot.
- Branch protection (Step 6) is recommended to prevent any single person from pushing changes without review.

---

## After setup, telling the team

Once auto-sync is live, update the documentation:

1. In `WORKFLOW.md`, the "Developer workflow" section should be updated to reflect that the CLI upload step is no longer manual.
2. In `EDITOR_GUIDE.md`, no changes needed, the editor workflow is unaffected (HubDB / page editor / file manager still work the same way).
3. In `IT_HANDOFF.md`, add a note that GitHub Actions is now part of the deploy pipeline.

---

## What this does NOT do

- Does **not** sync HubSpot → GitHub (one-way only: git → HubSpot)
- If someone edits a file directly in HubSpot Design Manager, the change does NOT flow back to GitHub. The next git push will OVERWRITE the HubSpot change.
- To avoid this: always edit locally, push via git. Or: when you've edited directly in HubSpot, `git pull` first AFTER pulling the change down via `hs cms fetch`.

For most editorial work (HubDB, Files), this isn't an issue, those aren't part of the theme files. It's only an issue if someone edits HTML/CSS/JS directly in Design Manager.

---

## Questions?

This guide should be sufficient to set up auto-sync. If something doesn't work, the GitHub Actions logs are the first place to look. Then ask Emmanuel.
