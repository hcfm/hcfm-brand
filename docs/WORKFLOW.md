# HCFM Brand Portal — Workflow Guide

**Audience:** Anyone who needs to understand how the brand portal works, where files live, and how changes get made.
**Last updated:** 2026-05-11
**Owner:** Emmanuel Epau (eepau@hcfm.org), Victoria Hassan (vhassan@hcfm.org)

---

## What this document is

A single source of truth for **how the HCFM Brand Portal operates**. Read this first if you're new to the project. Then read the role-specific guides:

| If you're… | Read |
|---|---|
| A marketing-team member who wants to edit content | [EDITOR_GUIDE.md](EDITOR_GUIDE.md) |
| On the IT team and need to understand the technical architecture | [IT_HANDOFF.md](IT_HANDOFF.md) |
| A developer continuing the build | This doc, then [GITHUB_AUTO_SYNC.md](GITHUB_AUTO_SYNC.md) |

---

## The portal in one paragraph

**hcfm.org/brand** is the public-facing canonical home for HCFM's brand identity. It replaces the previous SharePoint Visual Identity site (which was permission-gated, broken in places, and held outdated information). The portal is hosted on **HubSpot CMS Hub**, with editable content stored in **HubSpot HubDB tables**, downloadable assets in **HubSpot File Manager**, and the source code mirrored in a **GitHub repository** for version control and audit history. Any change made through HubSpot's UI or via the local code workflow is visible to the public within ~30 seconds.

---

## The 3 layers of the system

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: SOURCE CODE                                           │
│  Where: Emmanuel's Mac + GitHub repo                            │
│  github.com/EmmanuelEpau/hcfm-brand                             │
│                                                                 │
│  Contains: HTML templates, CSS styles, JS scripts, the          │
│  Word letterhead .docx files, helper scripts, documentation.    │
│  This is the SOURCE OF TRUTH for the technical build.           │
└────────────────────────────┬────────────────────────────────────┘
                             │  uploaded via HubSpot CLI
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: HUBSPOT (the hosting platform)                        │
│  Where: app.hubspot.com (account 275132 / "Family Rosary, Inc.")│
│                                                                 │
│  • Design Manager → theme files (HTML/CSS/JS/modules)           │
│  • File Manager   → images, PDFs, Word docs, downloads          │
│  • HubDB          → 3 tables driving dynamic content            │
│  • Memberships    → Tier 1 (Ministry) + Tier 2 (Admin) groups   │
│  • Website Pages  → the page record at /brand                   │
│                                                                 │
│  This is where the WEBSITE actually runs.                       │
└────────────────────────────┬────────────────────────────────────┘
                             │  HubSpot CDN
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: PUBLIC PAGE                                           │
│  Where: https://www.hcfm.org/brand                              │
│                                                                 │
│  Anyone can browse without signing in. Downloads tab is gated:  │
│  brand documents (public), logo packs / templates / fonts /     │
│  ministry-center logos (Tier 1 password), source AI files       │
│  (Tier 2 admin sign-in).                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Where to do each kind of task

| Task | Best path | Time |
|---|---|---|
| Add or edit a chatbot answer | HubSpot UI → Content → HubDB → HCFM Chatbot Knowledge Base | 2 min |
| Add or edit an FAQ | HubSpot UI → Content → HubDB → HCFM FAQ | 2 min |
| Add a ministry center to the directory | HubSpot UI → Content → HubDB → HCFM Ministry Centers | 5 min |
| Update page copy on Symbol / Voice / Design Elements | (after module refactor) Page editor in HubSpot | 5 min |
| Update page copy on other sections | Code edit in Design Manager OR local workflow | 10 min |
| Change a brand color hex code globally | Design Manager → `_hcfm-brand-portal/css/hcfm-styles.css` (top of file) | 5 min |
| Upload a new logo or downloadable file | HubSpot UI → Files → `_hcfm-brand/` → upload | 1 min |
| Add or refactor a whole section | Local code workflow → CLI upload → commit + push | 30-60 min |
| Update the chatbot logic or downloads behavior | Local code workflow | 30-60 min |
| Manage who has admin access | HubSpot UI → Content → Memberships | 5 min |

---

## The three places content lives

### 1. Design Manager (theme code) — `_hcfm-brand-portal/`

Path in HubSpot UI: **Content → Design Manager → `_hcfm-brand-portal`**
Direct URL: `https://app.hubspot.com/design-manager/275132`

```
_hcfm-brand-portal/
├── templates/
│   └── hcfm-brand-portal.html       # the main page template, all section HTML
├── css/
│   └── hcfm-styles.css              # all colors, fonts, layout, design tokens
├── js/
│   └── hcfm-scripts.js              # chatbot, downloads, interactions
├── modules/                          # editable modules (used in template via HubL)
│   ├── hcfm-color-swatch.module/
│   ├── hcfm-faq-item.module/
│   ├── hcfm-help-card.module/
│   ├── hcfm-symbol-layer.module/    # (after module refactor)
│   ├── hcfm-voice-rule.module/      # (after module refactor)
│   └── hcfm-design-element.module/  # (after module refactor)
├── fields.json                       # theme-level field definitions
└── theme.json                        # theme metadata
```

This is where the **technical build** lives. Most non-technical edits should go through the Editor's Guide, not direct code edits.

### 2. File Manager (assets + downloads) — `_hcfm-brand/`

Path in HubSpot UI: **Content → Files → `_hcfm-brand`**
Direct URL: `https://app.hubspot.com/files/275132`

```
_hcfm-brand/
├── assets/
│   ├── logos/             # parent HCFM logos (PNG)
│   ├── previews/          # per-ministry logo galleries (PNG)
│   ├── photography/       # imagery section photos
│   ├── symbol-visuals/    # 5 symbol layer images
│   ├── fonts/             # Whitney, Calluna, Playlist Script
│   └── ministry-manifest.json  # config: which logos go to which ministry
└── downloads/
    ├── public/            # public PDFs (Brand Guidelines, Style Guide)
    ├── source-files/      # admin-only AI/EPS source packs
    └── templates/
        ├── letterheads/   # 6 .docx letterhead files
        └── stationery-samples/  # letterhead + envelope reference images
```

Every file here has a public CDN URL pattern:
`https://275132.fs1.hubspotusercontent-na1.net/hubfs/275132/_hcfm-brand/{path}`

### 3. HubDB (dynamic structured content)

Path in HubSpot UI: **Content → HubDB**
Direct URL: `https://app.hubspot.com/hubdb/275132`

Three tables drive dynamic content:

| Table | ID | Rows | Used by |
|---|---|---|---|
| HCFM Chatbot Knowledge Base | 282697845 | ~271 | The "Ask the brand" chatbot |
| HCFM FAQ | 282697015 | 17 | FAQ section |
| HCFM Ministry Centers | 282663491 | 24 | Sub-ministry directory cards |

Editing rows in HubDB is the fastest way to update dynamic content — no code, no developer needed.

---

## The standard workflow for changes

### A. Editor workflow (Marketing team — no code)

```
You spot something to fix
        ↓
Open HubSpot (app.hubspot.com)
        ↓
Navigate to the right tool:
   • HubDB        → chatbot, FAQ, ministry data
   • Page editor  → page-level content via modules
   • Files        → swap an image or document
   • Design Mgr   → if you need to touch HTML/CSS (technical)
        ↓
Make the edit
        ↓
Click "Publish" (in HubDB) or "Update" (in Files)
        ↓
Live within 1 minute
```

See [EDITOR_GUIDE.md](EDITOR_GUIDE.md) for step-by-step on each kind of edit.

### B. Developer workflow (Emmanuel / future developer)

```
Edit files locally on Mac
   (~/Desktop/.../Brand_Page_Mockup/)
        ↓
Test locally if applicable
        ↓
Upload to HubSpot via CLI:
   npx @hubspot/cli cms upload theme/_hcfm-brand-portal \
       _hcfm-brand-portal --account=brand-portal
        ↓
Commit to git:
   git add -A
   git commit -m "What changed and why"
   git push origin main
        ↓
Live within 30 seconds (HubSpot CDN refresh)
        ↓
GitHub history captures the change forever
```

Once GitHub auto-sync is configured (see [GITHUB_AUTO_SYNC.md](GITHUB_AUTO_SYNC.md)),
the **commit + push** step replaces the **CLI upload** step — push to main, HubSpot deploys automatically.

---

## The audit trail

Every change to the brand portal is captured in **git history**:
- View at: `https://github.com/EmmanuelEpau/hcfm-brand/commits/main`
- Each commit shows: timestamp, author, what changed, why
- Reverting a change: `git revert <commit-id>` + re-push

This is the audit artifact for any compliance / IT / management review. There is no edit that's untracked.

HubSpot also keeps its own revision history per file (Design Manager) and per row (HubDB), as a secondary safety net.

---

## Who has access to what

| Person | What they can do |
|---|---|
| **Emmanuel Epau** | Full HubSpot Super Admin; full GitHub repo access; can edit anything |
| **Victoria Hassan** | HubSpot Marketing access; can edit HubDB, Pages, Files, modules; cannot delete the theme |
| **Margaret Dwyer Hogan** | (Set as needed) — HubSpot Marketing access |
| **Colum Devine** | HubSpot Marketing access (read-mostly for now) |
| **IT team** | Standard HubSpot admin access on a need basis |
| **Ministry-tier members** (added per request) | Auto-unlocks Tier 1 Downloads (logo packs, templates) when signed in |
| **Admin-tier members** | Full Tier 2 access (source AI files) |

To add or change someone's access: HubSpot UI → Account Settings → Users & Teams.

---

## Cost overview

| Component | Cost | Who pays |
|---|---|---|
| HubSpot CMS Hub Pro (hosting + Memberships) | Already on existing HCFM plan | HCFM |
| GitHub repository (private) | Free (under HCFM's GitHub org if added, otherwise Emmanuel's personal account) | Free |
| Domain (hcfm.org/brand) | Already part of HCFM domain | HCFM |
| Optional: Cloud.typography Whitney license | ~$150/year (when production needs it) | TBD |
| Optional: Anthropic API for Phase 2 LLM chatbot | ~$15-50/month at expected volume | TBD |

**Current monthly cost added by the brand portal: $0** beyond existing HubSpot costs.

---

## Where to ask for help

| Question type | Who |
|---|---|
| "How do I edit X?" | Read [EDITOR_GUIDE.md](EDITOR_GUIDE.md); if still stuck, Emmanuel or Victoria |
| "Why does X look broken?" | Emmanuel (most likely) or the brand portal chatbot |
| "Can we add Y feature?" | Emmanuel, Victoria, Margaret as a group decision |
| Technical / hosting issue | Emmanuel, then IT |
| Access / permissions | Victoria or Emmanuel can grant marketing access; IT for admin |

---

## Status: live and operational

| Capability | Status |
|---|---|
| Public brand portal at hcfm.org/brand | ✅ Live |
| Chatbot with 271 KB entries | ✅ Live |
| 24 ministry-center directory + galleries | ✅ Live |
| Password-gated downloads | ✅ Live |
| Letterhead templates | ✅ Live |
| Help-page forms (email-based) | ✅ Live |
| Git audit history | ✅ Live |
| Editor's Guide for non-developers | ✅ This document set |
| GitHub auto-sync from main branch | ⏳ Setup steps in [GITHUB_AUTO_SYNC.md](GITHUB_AUTO_SYNC.md) |
| Phase 2 LLM-backed chatbot | ⏳ Architecture proposed in [CHATBOT_LLM_ARCHITECTURE.md](CHATBOT_LLM_ARCHITECTURE.md) |
