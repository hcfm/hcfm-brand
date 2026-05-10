# Phase 5: Memberships Migration Plan

Pre-built tomorrow-morning runbook. Replaces the JS `sessionStorage` password gate with native HubSpot Memberships.

---

## Current state (what we're replacing)

- `theme/_hcfm-brand-portal/js/hcfm-scripts.js` line 319: `const STORAGE_KEY = 'hcfm-dl-unlocked';`
- Two hardcoded passwords stored in JS (mostly visible to anyone who views source)
- Gate stored in `sessionStorage` — bypassable, shareable, no audit trail
- Two tiers: ministry (`hcfm2026`) and admin (`emmyvictoria`)

This is **demo-grade auth.** Phase 5 replaces it with real HubSpot Memberships.

---

## What we'll have after Phase 5

- **Two access groups in HubSpot Memberships**:
  - `HCFM Brand Portal — Ministry Tier` (members can view ministry-only downloads)
  - `HCFM Brand Portal — Admin Tier` (Easton internal — full source files)
- **Real authentication**: members log in via email + password (HubSpot manages it)
- **Email-invite based**: you add a member by email, they get a sign-up link
- **Audit trail**: every login + every protected-content view is logged
- **Bypassable: NO** (server-side gate, not JS-side)

---

## Step-by-step (run tomorrow)

### A. Create the access groups via HubSpot UI

1. Go to: https://app.hubspot.com/memberships/275132/access-groups/all
2. Click **Create access group**
3. Name: `HCFM Brand Portal — Ministry Tier`
4. Description: `Ministry-center designers requesting brand assets and ministry logo packs`
5. Save
6. Repeat for `HCFM Brand Portal — Admin Tier` with description `Easton internal — full source AI files`

### B. Set the brand-preview page (or specific download URLs) to require Membership

Two options:

**Option 1: Gate the entire `/brand-preview` page** (simplest, but blocks public viewing of the brand portal — probably NOT what you want)

**Option 2 (recommended): Keep `/brand-preview` public, but build a separate `/brand/downloads` page that requires Membership**
1. Create a new page in Content → Website Pages
2. Use the same theme template
3. Set Settings → Audience access → "Private — Single membership registration" → select access group
4. Move the locked download HTML there
5. From `/brand-preview`, link to `/brand/downloads` for the locked tier

**Option 3 (also clean): Use the page settings on `/brand-preview` to restrict only the Downloads section via JS, but require login for it**
- Keeps single URL
- Locked content rendered conditionally based on `request.contact.is_authenticated`

I recommend **Option 2** for clarity — public brand portal at `/brand-preview` (or `/brand`), gated source-file library at `/brand/downloads`.

### C. Add ministry-center contacts to the access groups

For each ministry contact who needs access:
1. Memberships → Members → Add member
2. Enter email
3. Choose access group(s)
4. Click Send invitation
5. They get a sign-up email, set password, log in

### D. Update the JS to use Membership-based auth

Replace the password gate logic with HubL-rendered conditionals:

In the template (Downloads section):
```hubl
{% if contact.is_logged_in %}
  {% if contact.list_memberships|selectattr('id','equalto', MINISTRY_GROUP_ID)|list %}
    <!-- Show ministry-tier downloads -->
  {% endif %}
  {% if contact.list_memberships|selectattr('id','equalto', ADMIN_GROUP_ID)|list %}
    <!-- Show admin-tier downloads (source files) -->
  {% endif %}
{% else %}
  <p>To access these files, <a href="/_hcms/mem/login">sign in</a> or 
  <a href="#help">email Victoria for an invite</a>.</p>
{% endif %}
```

This requires the access group IDs (from step A).

### E. Remove the JS sessionStorage gate code

Delete (or comment out) these blocks in `scripts.js`:
- Lines 319-360: the entire `STORAGE_KEY`, `ADMIN_KEY`, `unlockDownloads()`, `unlockAdmin()` logic
- Line 333, 341, 357: password input handling

The JS gate becomes a no-op since the server (HubL) controls visibility now.

### F. Push and test

```bash
npx -p @hubspot/cli@latest hs cms upload theme/_hcfm-brand-portal _hcfm-brand-portal
```

Republish the page. Visit `/brand-preview`:
- Without login: locked downloads are hidden, login prompt shown
- After login: downloads visible per your access group

---

## Time estimate

- A. Access groups creation: 5 min (UI clicks)
- B. New /brand/downloads page (or in-page conditional): 15 min
- C. Add 3-5 initial members: 5 min
- D. Template HubL update: 15 min
- E. JS cleanup: 5 min
- F. Push + test: 10 min

**Total: ~1 hour.** Doable in one focused sitting tomorrow.

---

## Things that block Phase 5

- **Joe Pereira (NOT needed)** — Memberships access groups can be created by you, no Super Admin required. I confirmed this in your account earlier.
- **Marketing Contacts tier impact**: Members log in via email → become CRM contacts. To avoid pushing past 78,039/100,000 mark, set Memberships → Settings → "Members count as marketing contacts: OFF". This is a one-time toggle.

---

## Pre-built code stub

When you're ready to do Phase 5 end-to-end, I'll generate the exact JS replacement and HubL conditional from this plan. Until then, this MD doc is the playbook.
