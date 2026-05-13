# HCFM Banner Studio

The web tool used to update the campaign banner that rides at the bottom of every HCFM email signature.

**Live URL:** https://emmanuelepau.github.io/hcfm-brand/banner-upload/

---

## What it does

You drop in a 600×200 PNG and click Publish. Behind the scenes it:

1. Validates the image (dimensions, file size, format)
2. Commits the file to `email-banners/parent/banner.png` (or `email-banners/ftp/banner.png`) on this repo
3. Triggers the auto-purge GitHub Action, which clears the jsDelivr CDN cache
4. Waits for the live URL to flip and confirms it back to you

Every HCFM email signature pulls its banner from a single URL on GitHub Pages. Once your upload is committed, every signature in the org is showing the new banner within about 10 minutes — no action from anyone else.

---

## Who can use this

Anyone with a personal access token (PAT) scoped to this repo. Today that's Emmy, Victoria, and whoever Emmy provisions a token for on the FTP and marketing teams.

A PAT is a long string GitHub gives you that proves you have permission to commit to this repo. The studio walks you through getting one the first time you visit.

---

## First-time setup (3 minutes, once per browser per person)

1. Go to **https://emmanuelepau.github.io/hcfm-brand/banner-upload/**
2. On the setup screen, click the link to open GitHub's token page
3. Fill in:
   - Name: `HCFM Banner Studio`
   - Expiration: 90 days
   - Repository access: **Only select repositories** → `EmmanuelEpau/hcfm-brand`
   - Repository permissions → **Contents**: Read and write
4. Click **Generate token**, copy the `github_pat_…` string
5. Paste it back into the studio and hit **Save token**

You won't have to do this again until the token expires (90 days). The token is stored only in your browser (`localStorage`), never sent anywhere except GitHub's API.

---

## Day-to-day use

1. Open https://emmanuelepau.github.io/hcfm-brand/banner-upload/
2. Drop your 600×200 PNG into the upload area
3. Pick **HCFM Parent** or **Family Theater Productions**
4. Type a short note about what the banner's for (it shows up in the audit log)
5. Click **Publish banner**
6. Watch the status — it'll confirm when the banner is live globally

That's it. The banner is now updating in every email signature on the side you selected.

---

## Banner specs

| Spec | Required |
|---|---|
| Format | PNG (no JPG, no GIF, no WebP) |
| Dimensions | Exactly **600 × 200** pixels |
| File size | Under **100 KB** recommended, hard limit **250 KB** |
| Hyperlink | The HTML signature wraps the banner in a click-through; design accordingly |

---

## Troubleshooting

**"Your token doesn't have permission."**
The PAT you used isn't scoped right. Re-create it with **Contents: Read and write** on the `hcfm-brand` repo.

**"Someone else updated the banner just before you."**
Two people published at the same time. Reload the page and re-publish.

**"We didn't see the change on the live URL yet, but it usually arrives within 10 minutes."**
GitHub Pages takes up to 10 minutes to refresh its CDN. The commit went through; the URL will catch up soon. Recipients who open emails after that point see the new banner.

**"It looks like the old banner in my Outlook compose view."**
Your own browser cached the old image. Close and reopen the compose window, or use a fresh browser tab. Recipients getting your emails for the first time see the latest banner regardless.

---

## What happens behind the scenes

```
[Banner Studio]   →   [GitHub Contents API]   →   [hcfm-brand repo: commit]
                                                           ↓
                                          ┌────────────────┴────────────────┐
                                          ↓                                 ↓
                            [GitHub Pages rebuild]            [purge-jsdelivr workflow runs]
                                          ↓                                 ↓
                          [emmanuelepau.github.io/...]            [cdn.jsdelivr.net/... cache cleared]
                                          ↓
                              Every email signature
                              referencing this URL
                                  serves the new
                                    banner image
                                       ↓
                       [Recipients see the new banner on next email open]
```

---

## Files

- `index.html` — the studio app (single-file vanilla HTML/JS, no build step)
- `README.md` — this file

Hosted via GitHub Pages from `main`. The `.nojekyll` file at the repo root lets this folder serve directly without Jekyll processing.
