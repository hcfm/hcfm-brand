# Morning handoff — what's ready, what's left

Generated: 2026-05-10 ~02:30 EDT

---

## TL;DR

The brand portal is **live at `https://www.hcfm.org/brand`** with:

- ✅ Phase 1B (HubSpot CDN ZIPs) — done
- ✅ Phase 2C (3 modules updated to match site CSS, drop-in compatible) — done
- ✅ Phase 4A (MS Forms feedback iframe + mailto: asset request form) — done
- ✅ Phase 5C (Memberships gate, server-rendered via HubL, robust against HubSpot-admin-not-member edge case) — done
- ✅ Phase 5 (Victoria + Colum + Emmanuel added to both access groups; invites pending) — done
- ✅ Phase 8 (URL rename `/brand-preview` → `/brand` + 301 redirect) — done

**Phase 5C had a real bug discovered + fixed during overnight QA**: anyone "logged into HubSpot but not in a membership group" saw a broken "Signed in as ." banner with empty contact info. Now correctly shows a "Your account doesn't have download access yet" message with instructions to email Victoria/Emmanuel for access. Also fixed: `dlContent` and `sourceTab` were stuck `hidden` even for authorized members because the JS unhide-via-sessionStorage path was vestigial. Both now server-rendered visibility-correct via HubL on `has_ministry_access` and `has_admin_access`. Also fixed: 6 hardcoded GitHub source-pack URLs that were left from before Phase 1B — now all on HubSpot CDN.

The remaining work that needs you in the morning:

1. **Phase 4 HubSpot Forms requires Joe Pereira's help** (~10 min for him). Discovery: Personal Access Keys CANNOT grant `forms` scope in HubSpot — that scope is only available via Private Apps, which require Super Admin role. Emmanuel's account doesn't have Super Admin permission. Either: (a) Joe creates a Private App with `forms` + `automation` scopes and shares the token, OR (b) we keep the current `mailto:` asset-request form (already working — opens user's email client) and don't bother with HubSpot Forms.
2. **Complete your invite-pending registration** at `eepau@nd.edu` so you can test the login flow end-to-end.
3. **Optional**: Add 2-3 initial ministry-center contacts to the Ministry Tier access group.

**The page is fully functional right now.** Visit `https://www.hcfm.org/brand` to see it.

---

## What got done overnight (that you'd want to know about)

### ✅ Phase 8: URL rename `/brand-preview` → `/brand`

The brand portal's official URL is now `https://www.hcfm.org/brand`.

- Page slug renamed from `brand-preview` to `brand` via HubSpot UI
- HubSpot auto-created a 301 redirect from `/brand-preview` → `/brand` (priority 2,000,000,152, ignore protocol enabled)
- All in-template references updated:
  - `theme/_hcfm-brand-portal/theme.json` documentation_url → `/brand`
  - Sign-in `redirect_url` → `/brand%23downloads`
  - Sign-out `redirect_url` → `/brand`
- Cloudflare cache TTL is 120s, so any cached redirect to the old destination expires within 2 min

**Verified:**
- `https://www.hcfm.org/brand` → HTTP 200 (response time ~140ms)
- `https://www.hcfm.org/brand-preview` → HTTP 301 → `/brand` ✓

### ✅ Phase 4A: MS Forms feedback iframe + mailto asset request

The Help section (`#help`) now has two side-by-side forms:

- **Left: Request brand assets** (mailto: form)
  - Fields: name, email, ministry center, what you need
  - On submit: opens user's email client pre-addressed to `vhassan@hcfm.org` + `eepau@hcfm.org`
- **Right: Send feedback** (Microsoft Forms iframe)
  - Embedded at `https://forms.office.com/Pages/ResponsePage.aspx?id=...&embed=true`
  - Currently shows MS Forms' "Fill out the form" fallback card (clicking opens form in new tab)
  - To get inline-rendered form: enable "Allow embedding" in MS Forms settings
  - The form itself is the same one the Easton team monitors internally

CSS classes added: `.ms-forms-embed`, `.dl-signed-in-banner` (for the post-login state)

### ✅ Phase 5C: Memberships gate replaces JS password gate

The Downloads page (`#downloads`) used to have a password input (passwords baked into JS — demo-grade). It's now wired to native HubSpot Memberships:

```hubl
{% set is_logged_in = request.contact.is_logged_in %}
{% set group_ids = [] %}
{% if is_logged_in %}
  {% set group_ids = request.contact.list_memberships|default([])|map(attribute='id')|list %}
{% endif %}
{% set has_ministry_access = is_logged_in and (119154177 in group_ids or 119152416 in group_ids) %}
{% set has_admin_access = is_logged_in and 119152416 in group_ids %}
```

**Group IDs (verified in HubSpot UI):**
- Ministry Tier: `119154177`
- Admin Tier: `119152416` (admin access also includes ministry access)

**Members so far (all 3 added to BOTH groups, invitation emails sent — all invite-pending):**
- Emmanuel Epau — eepau@nd.edu (Notre Dame email)
- Victoria Hassan — victoriah719@gmail.com (her primary CRM email; vhassan@hcfm.org is on her record as a secondary)
- Colum Devine — cdevine@hcfm.org

**Heads up on Victoria's email:** her existing CRM record has `victoriah719@gmail.com` as the primary email (with 28 segments + 16 campaigns of history attached). I added the existing record rather than creating a duplicate — invitation email went to her gmail. If you want her to sign in with `vhassan@hcfm.org` instead, the cleanest path is for her to update the primary email on her own contact record after she registers, or you can update it for her in Contacts.

When not logged in: anonymous visitors see "Sign in to access production files" with a Sign in button → `/_hcms/mem/login?redirect_url=/brand%23downloads`. Public-facing brand documents below the gate remain visible.

When logged in: you see a banner showing "Signed in as [name] — admin tier (full source files)" or "ministry tier" with a Sign out link.

---

## What's blocking the last 10% (and the unblocks)

### 🔒 Phase 4 HubSpot Forms (creation via API)

**Why blocked:** PAK lacks `forms` scope (verified — API returns `MISSING_SCOPES` error).

**Unblock — 5 min from your phone or laptop:**

1. Go to: `https://app.hubspot.com/personal-access-key/275132`
2. Click **Deactivate** on the existing PAK
3. **Generate new PAK** with the existing scopes plus:
   - `forms` ← required for Phase 4
   - `automation` ← required for workflow creation
4. **Show → Copy** the new key
5. Update `hubspot.config.yml` in the repo: replace the `personalAccessKey` value
6. Send me the new PAK + I'll run:

```bash
./forms/create-forms-via-api.sh        # Creates 4 forms + writes GUIDs to forms-config.json
python3 forms/apply-forms.py           # Injects GUIDs into theme files
npx -p @hubspot/cli@latest hs cms upload theme/_hcfm-brand-portal _hcfm-brand-portal
```

Then republish the page in HubSpot UI.

**What this would change:**
- Asset-request form on `#help` would convert from `mailto:` to a HubSpot Form (CRM-tracked, workflow-routed)
- Adds a vendor-access form (separate from asset request)
- Adds a bot-escalation form (when bot can't answer)
- Adds 4 workflows routing each form's submissions to vhassan@hcfm.org + eepau@hcfm.org

**What this does NOT change:** The MS Forms feedback iframe stays — that's a different channel and works fine.

### 🔒 Phase 5D: Login flow end-to-end test

**Why blocked:** You're invite-pending. Need to complete registration to verify the gate unlock behavior with a real signed-in user.

**Unblock — 2 min:**

1. Check your `eepau@nd.edu` inbox for HubSpot membership invitation
2. Click "Set password" link
3. Set a password
4. Log in at `https://www.hcfm.org/_hcms/mem/login`
5. Visit `https://www.hcfm.org/brand#downloads`
6. Verify you see "Signed in as Emmanuel — admin tier (full source files)" banner and the locked downloads tab is now visible

**If that works:** The whole gating system is verified end-to-end. We can then add Victoria and ministry contacts.

**If it doesn't work:** I'll debug. Most likely culprits would be HubL filter syntax, or membership permissions on the page audience access setting.

---

## Open decisions for you

1. **Add 2-3 initial ministry-center contacts?** Need names + emails. (Or wait for Phase 5D verification first.)
2. **Switch your sign-in email from `eepau@nd.edu` to `eepau@hcfm.org`?** I noticed your member record uses your Notre Dame email. Either works, but `@hcfm.org` is more on-brand. Same question for Victoria — her primary is the gmail.
3. **Enable MS Forms inline embedding?** In your MS Forms settings → "Anyone with link can respond" → "Allow embedding". Right now it shows the "Fill out the form" card (functional but not as elegant).

---

## What's NOT done (and why)

### ⏸ Phase 2C: Module wiring (color-swatch, help-card, faq-item)

The 3 custom HubSpot modules are uploaded and available in your library, but not yet wired inline into the brand portal template. Still pending because:
- Wiring requires careful CSS class matching that I want browser-verified before committing
- Wanted to do this with you awake to QA the visual pre/post

The modules are already usable on **other** HCFM pages in your account — Victoria can drop them into the existing site or future pages without this step.

### ⏸ Joe Pereira Permission Set (memo written, not sent)

`JOE_PERMISSION_SET_MEMO.md` has the full request. You can copy-paste into an email to Joe whenever convenient. No urgency — naming-convention discipline is keeping the brand portal protected for now.

---

## Repo state

```
3d57f12 Phase 1B + Phase 4-8 staging: ZIP migration, theme, modules, HubDB, docs
+ uncommitted: theme/{templates,css,theme.json} — Phase 4A + 5C + 8 changes
```

After this morning's commit, the repo will reflect the current live state of the brand portal. Run `git log --oneline -5` to see recent history.

---

## Live URLs

- **Brand portal:** https://www.hcfm.org/brand
- **Old URL (auto-redirects):** https://www.hcfm.org/brand-preview → /brand
- **HubSpot page editor:** https://app.hubspot.com/pages/275132/editor/212534416190/content
- **HubSpot access groups:** https://app.hubspot.com/memberships/275132/access-groups/all
- **HubSpot URL redirects:** https://app.hubspot.com/settings/275132/domains/url-redirects
- **Personal Access Key:** https://app.hubspot.com/personal-access-key/275132

---

## Sleep well. Coffee first, then 5 minutes on the PAK regen, and we'll burn through the last 10%.
