# HCFM Brand Portal — Launch Playbook

The sequence to take the brand portal from `/brand-preview` (current preview state) to `/brand` (official launch) and announce it to the team.

---

## Pre-launch checklist

- [ ] **Phase 4 (Forms)** done — 4 HubSpot Forms created, embedded in template, workflows live
- [ ] **Phase 5 (Memberships)** done OR consciously deferred — locked downloads either gated by Memberships or kept on JS gate with documented bypass
- [ ] **Final QA** — every page renders, every link works, every form submits, mojibake-free, fonts load
- [ ] **Joe's Permission Set** done OR sent (memo in JOE_PERMISSION_SET_MEMO.md)
- [ ] **Victoria + Colum signed off** on content + structure

---

## Step 1: Rename the URL `/brand-preview` → `/brand`

**This is the official launch flag. 30 seconds.**

1. Go to: https://app.hubspot.com/pages/275132/editor/212534416190/settings
2. Under **Page URL**, change Content slug from `brand-preview` to `brand`
3. Click **Save**, then **Update** (top-right)
4. Verify by visiting: https://www.hcfm.org/brand
5. **Add a 301 redirect from `/brand-preview` → `/brand`** so any existing links to the preview don't break:
   - Settings → Domains & URLs → URL Redirects → Add redirect
   - Original URL: `/brand-preview`
   - Target URL: `/brand`
   - Type: 301 (permanent)

---

## Step 2: Internal soft launch (Easton team)

Send to: Margaret Dwyer Hogan, Allan Mirasol, Father Fred Jenga, Joe Pereira, Colum Devine

Subject: **Brand portal is live — `hcfm.org/brand`**

Body:

> The HCFM brand portal is live at https://www.hcfm.org/brand
>
> What it is: a single canonical reference for the entire 2026 visual identity system — colors, typography, logos, voice, ministry directory, downloads. Built on HubSpot, fully editable by the Easton team.
>
> What it solves:
> - SharePoint can no longer block external consultants and ministry-center designers
> - The same brand questions stop coming to Easton over email — bot answers them, FAQ catches the structured ones
> - Ministry centers in 18 countries finally have a clean reference for the 2026 system
>
> 24-hour grace period before sending to the full ministry-center distribution. If anything looks off, please tell Victoria or me before the wider announcement goes out.

---

## Step 3: Public announcement to ministry centers

Wait 24 hours after the internal soft launch. Then:

**Distribution list:** All ministry-center marketing leads + design teams in Philippines, East Africa, Bangladesh, Latin America, Ireland, Canada, France

Subject: **A new home for the HCFM brand — hcfm.org/brand**

Body:

> The brand identity guide is now at https://www.hcfm.org/brand
>
> Everything you need is on one page:
> - Colors (with click-to-copy hex values)
> - Fonts (Whitney, Calluna, Playlist Script — all downloadable)
> - Logos (every ministry, every variant, every color)
> - Voice and tone
> - Photography guidelines
> - Platform dimensions (Instagram, Facebook, LinkedIn, X, YouTube)
> - 24 sub-ministries directory
>
> Plus:
> - **Ask the brand** chatbot (lower-right) for quick questions
> - **FAQ** with the most common questions ministry centers ask
> - **Downloads tab** for production files (request access from Victoria or Emmanuel)
>
> Please bookmark this URL. SharePoint is being phased out for brand reference.
>
> If a question isn't answered, ask the bot — and if the bot can't answer, the question gets escalated to us, and we'll add the answer to the bot for next time.
>
> Questions: vhassan@hcfm.org or eepau@hcfm.org

---

## Step 4: Update internal references

- [ ] Update email signature for marketing team (add `hcfm.org/brand` link)
- [ ] Pin the URL in the marketing WhatsApp groups (Philippines, East Africa, etc.)
- [ ] Add a banner to SharePoint Visual Identity site: "Brand identity has moved → hcfm.org/brand"
- [ ] Forward the Joe Pereira memo (JOE_PERMISSION_SET_MEMO.md) so the Permission Set hardening happens within ~2 weeks

---

## Step 5: First-30-day monitoring

Check these weekly:

| Metric | Where to find it | Healthy signal |
|---|---|---|
| Page views | Marketing → Analytics → Pages → `/brand` | >300 in week 1, leveling at >100/week thereafter |
| Locked-tier downloads | HubSpot Files → `_hcfm-brand/downloads/` view counts | >20/month after first month |
| Form submissions | Marketing → Forms → `hcfm-brand-asset-request`, `hcfm-brand-feedback` | At least 1-2/week of either |
| Bot questions asked | Custom Events → `hcfm_bot_question` | Tracks how engaged the bot is |
| Bot escalations (no-match) | Form submissions on `hcfm-bot-escalation` | Each one becomes a new KB entry |

If after 30 days:
- **Page views <100/week**: needs more internal promotion
- **Form submissions = 0**: forms might be broken, OR ministry centers are still using email → check via direct email
- **Bot escalations >5/week**: KB needs a content refresh cycle

---

## Step 6: Quarterly maintenance cycle

Every 90 days, Victoria + Emmanuel:
- [ ] Review FAQ submissions, add useful Q&A to `hcfm_faq` HubDB table
- [ ] Review bot escalations, convert each into a `hcfm_chatbot_kb` row
- [ ] Audit ministry directory for any new ministries or changes
- [ ] Check whether any Phase 5 access groups need additions/removals
- [ ] Review form submission summary — which ministries are most active?
- [ ] One "what's new" post to ministry centers if anything material changed

---

## Rollback plan (if something breaks)

If the published `/brand` page has a critical issue:

1. **Quick revert: re-pin /brand-preview as the public URL** by reversing Step 1
2. **Roll back template:** in Design Manager, navigate to `_hcfm-brand-portal/templates/hcfm-brand-portal.html` → Actions → Revert to previous version
3. **If forms misroute:** turn off the workflows (Settings → Workflows → toggle off) and the forms revert to silent capture in CRM only
4. **If chatbot KB issues:** un-publish the `hcfm_chatbot_kb` HubDB table — bot falls back to the inline JS code (still works)
5. **Last resort:** the entire repo at `EmmanuelEpau/hcfm-brand` is the source of truth. `git reset --hard <commit>` + `hs cms upload theme/_hcfm-brand-portal _hcfm-brand-portal` restores any prior state.

---

## Final URL

Once Step 1 is complete: **https://www.hcfm.org/brand**

This is the URL Victoria and Colum will share, that ministry centers will bookmark, that vendors will reference, that the marketing team will print on email signatures and business cards.

This is the brand portal.
