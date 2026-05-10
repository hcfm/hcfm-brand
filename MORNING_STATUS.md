# Morning status — what happened overnight

Generated: 2026-05-10 ~01:35 EDT

---

## What got done while you slept

### ✅ Phase 1B: GitHub-Releases ZIPs migrated to HubSpot Files

**449 MB across 30 ZIPs** uploaded to `_hcfm-brand/downloads/source-files/`:

- `parent/` — 6 files (HCFM_Symbol_SOURCE.zip, HCFM_Logotype1-4_SOURCE.zip, HCFM_Parent_SOURCE_Pack.zip)
- `ministries/` — 24 files (one per sub-ministry, e.g., `02_HCFM_Foundation_SOURCE.zip`)

**Updated `theme/_hcfm-brand-portal/js/hcfm-scripts.js`:**
- `RELEASE_BASE` now points to HubSpot Files (`https://275132.fs1.hubspotusercontent-na1.net/hubfs/275132/_hcfm-brand/downloads/source-files`) instead of GitHub Releases
- All 6 parent-pack URLs updated with `/parent/` subpath and `_SOURCE.zip` suffix
- Ministry pattern updated to use `/ministries/${m.code}_SOURCE.zip`

**Pushed to HubSpot.** Live page at `/brand-preview` now serves all source ZIPs from HubSpot CDN. **GitHub Releases is no longer a runtime dependency.**

### ✅ Phase 4 wiring pre-built (ready to plug in tomorrow)

Couldn't create the actual HubSpot Forms tonight (the existing PAK lacks the `forms` scope), but the entire downstream wiring is staged:

```
forms/
├── hcfm-brand-asset-request.json   ← Form schema (fields + post-submit message)
├── hcfm-brand-feedback.json        ← Form schema
├── hcfm-vendor-access.json         ← Form schema
├── hcfm-bot-escalation.json        ← Form schema
├── forms-config.json               ← GUID placeholder file
├── create-forms-via-api.sh         ← Script to create all 4 forms via API in one shot
└── apply-forms.py                  ← Script to inject GUIDs into scripts.js + template
```

Tomorrow morning, after you generate a PAK with `forms` scope:

```bash
# 1. Update hubspot.config.yml with new PAK
# 2. Run:
./forms/create-forms-via-api.sh        # Creates 4 forms, fills GUIDs into config
python3 forms/apply-forms.py           # Injects GUIDs into theme files
npx -p @hubspot/cli@latest hs cms upload theme/_hcfm-brand-portal _hcfm-brand-portal
# Then republish the website page in HubSpot UI.
```

**Phase 4 will be done in 5 minutes once the PAK has `forms` scope.**

### ✅ Phase 5 plan written (PHASE_5_MEMBERSHIPS_PLAN.md)

Step-by-step playbook for replacing the JS sessionStorage password gate with native HubSpot Memberships. Includes: access groups creation, page-level gating options, HubL conditional rendering, JS cleanup.

**Estimated build time: 1 hour, all UI-driven through your account.** No new scopes needed for this one.

### ✅ Joe Pereira memo written (JOE_PERMISSION_SET_MEMO.md)

Complete request for him to create a Permission Set restricting brand-portal edits to you + Victoria. You can copy-paste into an email when convenient.

### ✅ Launch playbook written (LAUNCH_PLAYBOOK.md)

Full sequence from `/brand-preview` → `/brand` rename through internal soft launch through ministry-center announcement through 30-day monitoring through quarterly maintenance.

---

## What I deliberately didn't do

### Phase 2C (module wiring) — deferred

The 3 modules (color-swatch, help-card, faq-item) are in your HubSpot module library and ready to use. I chose not to wire them inline into the brand portal template tonight because:

- Reversibility is hard mid-flight; if I broke something at 3am, you'd wake to a broken page
- The wiring requires careful CSS validation (the `.help-card` class in module HTML must match the page's CSS)
- Your modules are AVAILABLE for use on other HCFM pages right now without this step
- The brand portal page works perfectly as-is; wiring is purely "make these inline parts editable through visual editor", which is nice-to-have not need-to-have

I'll do this in 30 min when you're awake, with browser to verify each visual change.

### Phase 4 forms (UI build path) — abandoned

Started building a form via the HubSpot Forms UI but the editor's multi-step nature would have required ~1 hour per form × 4 forms = 4 hours of click-by-click work, with high risk of session expiry mid-flight. The API path takes 5 min total once the scope is added. Vastly better.

### Phase 5 memberships build — deferred

Same reasoning as Phase 4: needs a full focused session with you available to test login flows. Plan written, build held.

---

## What you do this morning (5 min total)

1. **Re-login to HubSpot** if needed
2. **Go to: https://app.hubspot.com/personal-access-key/275132**
3. **Click Deactivate** on the existing PAK
4. **Generate new PAK** — check ALL these scopes:
   - Everything currently checked, PLUS:
   - `forms` ← required for Phase 4
   - `automation` ← required for workflow creation
5. **Show → Copy** the new key
6. **Update `hubspot.config.yml`** in the repo: replace the `personalAccessKey` value
7. **Paste the new PAK to me here** so I can confirm + start

After that, I'll burn through Phase 4 (~10 min), Phase 5 (~1 hour), Phase 2C (~30 min), Phase 8 URL rename (~30 sec), final QA (~30 min). **Total ~2.5 hours to fully launched.**

---

## State of the repo

Latest commit at this point includes:
- All Phase 1B changes (CDN URL updates in scripts.js)
- All Phase 4 staging files (forms/*)
- Phase 5 plan doc
- Joe memo
- Launch playbook
- This morning status

Run `git log --oneline -5` to see recent history.

---

## Live URL right now

**https://www.hcfm.org/brand-preview** — fully functional with:
- All assets self-hosted on HubSpot (incl. 30 ZIPs as of tonight)
- All fonts loading
- 3 HubDB tables driving FAQ + bot + ministry directory
- Theme deployed and locked from accidental cloning

Visit it as a sanity check. Nothing should look different from yesterday — except that the source-pack ZIPs now download from HubSpot CDN instead of GitHub. Test by going to the Downloads page and clicking "Download" on any ministry's source pack.

---

## Sleep well. See you in the morning.
