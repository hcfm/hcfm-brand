# HCFM Brand Portal, IT Handoff & Technical Reference

**Audience:** HCFM IT team and any future technical maintainer.
**Owner:** Emmanuel Epau (eepau@hcfm.org)
**Last updated:** 2026-05-11

This document explains **what the brand portal is technically, how it's hosted, what dependencies exist, and how IT can audit, monitor, or take over operation if needed.**

---

## TL;DR

| Question | Answer |
|---|---|
| What is it? | A custom-theme website hosted on HubSpot CMS Hub, public at hcfm.org/brand |
| Who hosts it? | HubSpot, same account that hosts hcfm.org and familyrosary.org |
| Who owns the code? | HCFM (mirrored in a GitHub repo controlled by Emmanuel) |
| Who has admin access? | Currently Emmanuel; HubSpot Super Admin permissions can be granted to IT or anyone |
| Are there third-party dependencies? | Minimal, Adobe Fonts (free with Creative Cloud), YouTube (embedded videos), HubSpot Memberships (paid feature already on HCFM account) |
| Where does sensitive data go? | Nowhere new. All data stays in HubSpot's existing infrastructure. No external AI services, no third-party analytics beyond what HCFM already uses |
| Cost? | $0 additional (uses existing HubSpot CMS Hub Pro subscription) |
| Can IT take over without losing functionality? | Yes, the architecture uses 100% standard HubSpot features. No proprietary code outside of standard HTML / CSS / JS / HubL templates |

---

## System architecture

```
                        Public users
                              │
                              ▼
                  https://www.hcfm.org/brand
                              │
                ┌─────────────┴─────────────┐
                │  HubSpot CMS (CDN-cached) │
                └─────────────┬─────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
  HubSpot Design       HubSpot File          HubSpot HubDB
  Manager              Manager               (3 tables)
  (theme code)         (images, downloads)   (dynamic content)
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              │  Source-of-truth: git history
                              ▼
                  github.com/EmmanuelEpau/hcfm-brand
                  (uploaded via HubSpot CLI from Mac)
```

No services run outside HubSpot. No webhook listeners, no cron jobs, no third-party APIs called from the live page (with one minor exception: YouTube embeds for the walkthrough videos).

---

## Hosting & infrastructure

### HubSpot account

- **Portal ID:** 275132
- **Account name:** Family Rosary, Inc.
- **Tier:** CMS Hub Pro (already in place before the brand portal, no plan upgrade needed)
- **Region:** US (na1 datacenter)
- **CDN:** Cloudflare-fronted (`275132.fs1.hubspotusercontent-na1.net` for files, `www.hcfm.org` for the page)

### Page record

- **HubSpot page ID:** 212534416190
- **Public URL:** https://www.hcfm.org/brand
- **Template:** `_hcfm-brand-portal/templates/hcfm-brand-portal.html`
- **Edit URL (HubSpot UI):** https://app.hubspot.com/pages/275132/editor/212534416190/content

### Domain

- **Domain:** hcfm.org (managed by HCFM, already configured in HubSpot)
- **Path:** `/brand`
- **No new DNS configuration required**, the brand portal lives on the existing HCFM domain

---

## What's stored where

### Theme files (HubSpot Design Manager)

Located at `_hcfm-brand-portal/` in HubSpot Design Manager. These are the **source-controlled** files.

| File | Purpose | Size |
|---|---|---|
| `templates/hcfm-brand-portal.html` | Single-page template, contains all section HTML | ~95 KB |
| `css/hcfm-styles.css` | All styles, colors, fonts, layout, design tokens | ~70 KB |
| `js/hcfm-scripts.js` | Chatbot logic, downloads, interactions | ~100 KB |
| `modules/` | Reusable editable components (HubL modules) | ~5 KB each |
| `fields.json` | Theme-level field definitions | <1 KB |
| `theme.json` | Theme metadata | <1 KB |

**Total theme footprint:** ~280 KB of code. Static text. No build step, no compilation.

### Asset files (HubSpot File Manager)

Located at `_hcfm-brand/` in HubSpot File Manager.

| Folder | Contains | Approx. size |
|---|---|---|
| `assets/logos/` | Parent HCFM logo variants (PNG) | ~3 MB |
| `assets/previews/ministries/` | 24 ministry-center logo galleries (PNG) | ~50 MB |
| `assets/photography/` | Imagery section photos | ~10 MB |
| `assets/symbol-visuals/` | Symbol page layer images | ~2 MB |
| `assets/fonts/` | Whitney, Calluna, Playlist Script font files | ~1 MB |
| `downloads/public/` | Brand Guidelines PDF, Style Guide PDF, etc. | ~5 MB |
| `downloads/source-files/` | (Empty, to be uploaded when admin source AI/EPS files are packaged) | 0 |
| `downloads/templates/letterheads/` | 6 Word letterhead .docx files | ~500 KB |
| `downloads/templates/stationery-samples/` | Letterhead + envelope reference webp images | ~150 KB |

**Total asset footprint:** ~80 MB. Comfortable within HubSpot's standard file storage limits.

### HubDB tables (dynamic content)

| Table name | Table ID | Rows | Purpose |
|---|---|---|---|
| HCFM Chatbot Knowledge Base | 282697845 | ~271 | Drives the "Ask the brand" chatbot |
| HCFM FAQ | 282697015 | 17 | Drives the FAQ section |
| HCFM Ministry Centers | 282663491 | 24 | Drives the sub-ministry directory |

---

## Authentication & access control

### Public access (default)

The brand portal is **fully public**, no login required to view colors, logos, fonts, voice guidelines, symbol meaning, photography rules, design elements, ministry directory, FAQ, chatbot. This is intentional: ministry centers, vendors, partners across 18 countries all need access without an account.

### Tier 1, password-gated downloads

These download tabs are gated behind a **single shared password**:
- Parent logos (PNG packs)
- Ministry-center logo packs (PNG)
- Fonts (Whitney, Calluna, Playlist Script .otf files)
- Templates (Word letterheads, stationery samples)

The password is currently set in `js/hcfm-scripts.js` as one of: `hcfm2026`, `eastoncreatives`, `familyrosary` (case-insensitive, multiple accepted for fault tolerance). Anyone with the password unlocks Tier 1 for that browser session.

Anyone with **Ministry Tier membership** in HubSpot Memberships auto-unlocks Tier 1 on sign-in.

### Tier 2, admin sign-in

The "Source files" tab (AI / EPS editable logo files) is gated behind **HubSpot Memberships**, Admin Tier group ID **119152416**.

Only members of that group see the Source Files tab when signed in. Server-rendered via HubL, anonymous users can't see the tab at all, even via DOM inspection.

### Membership groups

- **Ministry Tier:** Group ID **119154177** (auto-unlocks Tier 1 download password)
- **Admin Tier:** Group ID **119152416** (full Tier 2 access)

To add a user to a group: HubSpot UI → Marketing → Lists / Memberships, or via the contact's record.

---

## Source code & version control

### GitHub repository

- **URL:** https://github.com/EmmanuelEpau/hcfm-brand
- **Visibility:** Private
- **Branches:** `main` is the live branch. No staging branch currently.
- **Owner:** Emmanuel Epau's personal GitHub account. (Recommendation: transfer ownership to an HCFM-controlled GitHub organization if HCFM has one.)

### Local development setup

The complete source tree lives at `/Users/eepau/Desktop/RECENT/HCFM Branding/Brand_Page_Mockup/` on Emmanuel's Mac. Every commit pushes to GitHub. No build step, files are uploaded as-is.

### CLI tool

HubSpot's official CLI (`@hubspot/cli`) is used to upload changes from local to HubSpot. Installed via npm.

**Command Emmanuel runs to deploy:**
```bash
npx @hubspot/cli cms upload theme/_hcfm-brand-portal _hcfm-brand-portal --account=brand-portal
```

The `--account=brand-portal` flag refers to a profile configured in `hubspot.config.yml` (in the repo root). The config contains the access tokens and refresh keys for the HubSpot account.

⚠️ **`hubspot.config.yml` contains access tokens and is in `.gitignore`**, it's not in the public repo. To set up a new environment, Emmanuel runs `npx @hubspot/cli init` and authenticates with his Personal Access Key.

---

## Dependencies

### Required dependencies (live page won't work without these)

| Dependency | What it does | Cost | Risk if it goes away |
|---|---|---|---|
| HubSpot CMS Hub (existing) | Hosts the page, files, HubDB, memberships | Already paid | High, entire portal goes away |
| Adobe Fonts (Typekit kit) | Serves Calluna + Playlist Script | Free with Creative Cloud, or fallback to system fonts | Low, page degrades gracefully to fallback fonts |
| HubSpot Memberships (Tier 2 admin only) | Gates source AI files | Already part of CMS Hub Pro | Low, Tier 2 tab disappears, Tier 1 still works |
| Local CDN URLs (`275132.fs1.hubspotusercontent-na1.net`) | Serves images, downloads | Already part of HubSpot | High, but this is HubSpot's own CDN |

### Optional / non-blocking dependencies

| Dependency | What it does | Cost | Risk if it goes away |
|---|---|---|---|
| YouTube (embedded videos) | Two walkthrough videos in the Videos section | Free | Videos won't play; rest of page works |
| GitHub | Source code mirror + audit history | Free | Low, only affects developer workflow |
| Anthropic API (proposed Phase 2 only) | LLM-backed chatbot | $15-50/mo at expected volume | Not yet enabled |
| Cloud.typography (proposed Whitney font license) | Real Whitney font instead of fallback | ~$150/yr nonprofit pricing | Not yet enabled |

**Bottom line:** the brand portal has zero hard external dependencies beyond HubSpot itself.

---

## Security posture

### What goes out of HCFM's infrastructure

- Browser requests to YouTube when a user clicks Play on a walkthrough video
- Browser requests to Adobe Fonts CDN to load custom fonts
- Email submissions from the Help-page forms route through the user's email client (mailto:), they go directly to vhassan@hcfm.org and eepau@hcfm.org, never through a third-party form service

### What does NOT go out of HCFM's infrastructure

- No third-party analytics scripts beyond what HCFM already runs on the parent site
- No external AI services (the current chatbot is keyword-matched, all answers stored in HubDB)
- No tracking pixels, no marketing automation tools beyond HubSpot
- No CRM data is exposed via the public portal (Memberships auth checks are server-rendered, not client-side)
- No member PII appears in any JavaScript, only `is_logged_in` boolean and group ID list

### HTTPS / certificates

- Served over HTTPS via HubSpot's automatically-managed Let's Encrypt-style certs
- Same cert that covers the rest of `*.hcfm.org`
- No additional certificate management needed

### Content Security Policy (CSP)

- HubSpot's default CMS Hub CSP is in effect
- No customizations have been added
- This permits: HubSpot CDN, YouTube embeds, Adobe Fonts. No external scripts beyond standard inline JS for the chatbot/interactions.

### Penetration / audit

The portal has not been formally penetration-tested. Key surface areas:
- Tier 1 password is client-side validated, anyone who reads the JS source can find the password strings. This is **acceptable** because the gated content is **brand logos**, not sensitive data. The password is a friction barrier, not a security barrier.
- Tier 2 (admin) is server-side gated via HubSpot Memberships, which is enterprise-grade auth.
- Forms submit via mailto, no form data crosses the network beyond the user's email client.
- HubDB rows are publicly readable via HubSpot's HubDB API, by design, since they drive public content.

If a security review is required, the focus should be on:
1. HubSpot account security (2FA on admin accounts, role-based access)
2. Membership group governance (who's in which group)
3. Source code repo permissions (GitHub)

---

## Monitoring & uptime

The brand portal is part of the existing hcfm.org website. **Same uptime, same monitoring, same SLA as the main site.** No additional monitoring is currently in place specifically for the brand portal.

If IT wants to add monitoring:
- HubSpot CMS Pro has built-in performance reports (visit Reports → Website Pages → HCFM Brand Portal)
- External tools like UptimeRobot or Pingdom could monitor https://www.hcfm.org/brand for HTTP 200

### Recovery / failover

- The page is CDN-cached at the edge, so HubSpot's origin server going down only affects new edits (not viewing)
- If a deployment breaks the page, **HubSpot keeps revision history** per file, IT can roll back via the Design Manager UI without git
- Git also has full history for redundant rollback

### Change auditing

Every change is captured in two places:
1. **Git commits** at https://github.com/EmmanuelEpau/hcfm-brand/commits/main, every code change with author + timestamp + diff
2. **HubSpot revision history** per file in Design Manager + per row in HubDB

If IT needs to audit "who changed X on Y date," check both. Git is authoritative for code; HubSpot is authoritative for HubDB row edits and direct-in-UI edits.

---

## Disaster recovery scenarios

### Scenario 1: A file is accidentally deleted in HubSpot

**Recovery:** the local `theme/_hcfm-brand-portal/` folder on Emmanuel's Mac has a copy. Re-upload via CLI. Git also has full history.

### Scenario 2: HubSpot account is compromised

**Recovery:** restore from git. Reset all credentials. The HubDB tables would need manual restoration from the `build/chatbot_kb_v2_full.json` and similar artifact files.

### Scenario 3: Emmanuel is unavailable

**Recovery:**
- Victoria can edit HubDB, Pages, and Files directly via HubSpot UI without code access
- Any HubSpot Super Admin can edit theme code via Design Manager
- The GitHub repo is set up so any developer can clone and continue work
- This document set serves as the handoff

**Bus-factor recommendation:** transfer the GitHub repo to an HCFM-owned organization, give a second person Super Admin on HubSpot, and ensure at least one IT contact has Memberships admin access.

### Scenario 4: HubSpot goes out of business

**Recovery:** the brand portal could be ported to any standard web host with ~1 week of work. The code is standard HTML/CSS/JS. The HubDB rows can be exported as JSON (already done in `build/chatbot_kb_v2_full.json`). The files can be downloaded en masse from File Manager. There is no proprietary HubSpot syntax that doesn't have direct equivalents elsewhere, except HubL template tags, which would need to be converted to vanilla HTML.

---

## What IT should know

### IT does NOT need to:
- Install anything on HCFM servers
- Manage DNS for the brand portal beyond existing hcfm.org configuration
- Run any backups (HubSpot + git handle that)
- Provision storage (HubSpot handles)
- Set up authentication infrastructure (HubSpot Memberships)

### IT SHOULD know about / consider:
- The HubSpot account is shared across hcfm.org, familyrosary.org, and other HCFM digital properties. Brand portal changes shouldn't affect those, but changes to the global HubSpot account settings (e.g., disabling Memberships) would.
- Some files are stored at `_hcfm-brand/` in File Manager. These are public-CDN-served. If IT has a policy against public file URLs, that's an issue to discuss (the URLs are public by design, the content is brand assets).
- The brand portal has no dependencies on internal HCFM network infrastructure. It works from any internet connection.
- Audit & version control is fully captured in GitHub.

### IT involvement is recommended for:
- Granting HubSpot Super Admin to at least one IT contact (bus-factor)
- Adding monitoring/alerting if desired
- Periodically reviewing Memberships membership lists
- Reviewing the GitHub repo location (recommend transfer to HCFM org)
- Setting up GitHub auto-sync (see `GITHUB_AUTO_SYNC.md`) which reduces manual upload steps

---

## Frequently asked technical questions

### "Where can I see the code?"

GitHub: https://github.com/EmmanuelEpau/hcfm-brand
Or in HubSpot: Content → Design Manager → `_hcfm-brand-portal`

### "Can we make Victoria able to edit copy without touching code?"

Yes, for sections converted to HubSpot modules (FAQ items, color swatches, help cards already are; Symbol/Voice/Design Elements are being converted). For other sections, Victoria currently has Design Manager access to edit the template HTML directly. The Editor's Guide documents this.

### "What if the chatbot says something wrong?"

Victoria or Emmanuel edits the chatbot KB in HubDB (Content → HubDB → HCFM Chatbot Knowledge Base). Changes go live in 1 minute. Every change is logged in HubSpot's revision history. **No AI is involved in the current chatbot, it's pure keyword matching against the HubDB rows.**

### "Could the chatbot one day use AI?"

Yes, there's an architecture proposal for an LLM-backed chatbot in `docs/CHATBOT_LLM_ARCHITECTURE.md`. It would route through Claude (Anthropic) API. If pursued, IT would be involved in approving the integration and reviewing the data flow. Currently not active.

### "Where is sensitive data stored?"

There is no sensitive data on the brand portal. All content is brand identity material (colors, logos, fonts, voice guidelines, photo rules). No PII, no donor data, no financials. The only "private" content (Tier 2 source AI files) lives behind HubSpot Memberships auth, which is enterprise-grade.

### "How do we revoke someone's access?"

- **HubSpot Super Admin access:** Account Settings → Users & Teams → revoke
- **Membership tier (Ministry / Admin):** Marketing → Memberships → remove from group, OR delete the contact's account
- **GitHub repo access:** github.com/EmmanuelEpau/hcfm-brand → Settings → Collaborators → remove

### "What's the SLA on this site?"

Same as the rest of hcfm.org. HubSpot CMS Hub Pro has 99.99% uptime SLA per HubSpot's published terms.

---

## Contact

- **Primary technical owner:** Emmanuel Epau, eepau@hcfm.org
- **Co-owner (content):** Victoria Hassan, vhassan@hcfm.org
- **For escalation:** Margaret Dwyer Hogan (Easton Creatives)

For an IT audit or formal handoff meeting, contact Emmanuel directly.
