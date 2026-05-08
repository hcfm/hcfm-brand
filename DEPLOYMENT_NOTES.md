# HCFM Brand Identity — Deployment Notes

Plain-English answers to the questions you raised about how this thing actually runs.

---

## Where the contact forms go

Both forms on the **Help** page (Request brand assets, Send feedback) use `mailto:` handoff:

```html
<form action="mailto:vhassan@hcfm.org,eepau@hcfm.org">
```

When someone clicks **Send request** or **Send feedback**, the page hands the form off to whatever email client is set as the user's system default (Outlook, Gmail in browser, Apple Mail, etc.) with the body pre-filled and addressed to **both** Victoria and Emmanuel. The user reviews and clicks send from inside their own email client.

**Why mailto:** it works on day one without any server, database, or paid service. There is nothing to configure, no API key to manage, no CRON job to monitor. As long as the user has email set up, the message reaches both inboxes.

**The trade-off:** there is no central log of who has submitted requests. If someone submits and forgets to actually send the email, we never see it. If we want a real database of every request, we move to one of the options below.

### When you move to WordPress / HubSpot

| Platform | Form solution | Effort |
|---|---|---|
| WordPress | Gravity Forms or WPForms (free + paid tiers). Configure to email both Victoria and Emmanuel and store in the WP database. | 1 hour |
| HubSpot | Native HubSpot Forms. Submissions go directly into HubSpot CRM. Auto-route to both inboxes. Built-in reporting. | 30 minutes |
| Standalone | Formspree or Basin (no-server form backends). Free for low volume. | 15 minutes |

In any of these, the HTML form structure stays the same — only the `action` URL changes.

---

## What the brand helper is trained on

The "Ask the brand" floating button at the bottom-right opens a small chat panel. It is **not a generative AI model**. It is a hand-built knowledge base that lives inside `scripts.js`.

```js
const knowledge = [
  { q: ['primary color', 'primary palette'], a: 'Three primary colors: Black, HCFM Blue, Yellow Gold...' },
  { q: ['yellow gold vs muted gold'], a: 'Simple rule: if it is on a screen, use Yellow Gold...' },
  // ...25 entries covering colors, fonts, logos, voice, photography, etc.
];
```

When a user types a question, the helper scores their text against each entry's keyword list and returns the best match. If nothing matches, it suggests topics or directs the user to email Victoria or Emmanuel.

**Why this approach:** it works offline, costs nothing, and is fully predictable. Every answer is something a brand owner has approved. There is zero risk of the helper inventing color codes or making up rules. A real generative AI model could be wired in later (Claude API, OpenAI, etc.) with the brand book as context, but that costs money per query and introduces hallucination risk.

**To add a new Q&A pair:** open `scripts.js`, find the `knowledge` array, and add an entry with relevant keywords and the exact answer. The next reload picks it up.

**Hosted options if we want a real LLM later:**

| Service | Cost | What you upload |
|---|---|---|
| Claude API (Anthropic) | $3 / million input tokens | Brand book PDFs as context |
| Custom GPT (OpenAI) | $20/mo per maker | All HCFM brand docs |
| HubSpot Breeze | Included with HubSpot Pro | Knowledge base pages |
| Intercom Fin | Per-resolution pricing | All brand pages |

Recommendation: start with the keyword-match helper as it is. Move to a real LLM only after we see real usage volume justify it.

---

## Two passwords for Downloads

### Tier 1 — Ministry centers (PNG / JPG only)

For ministry-center designers, vendors, and most users.

**Default test password:** `hcfm2026` (or `eastoncreatives` or `familyrosary`)

Unlocks:
- Brand documents (already public, included for completeness)
- Parent logos — PNG / JPG packs only
- Ministry centers — PNG / JPG packs only
- Fonts — Whitney, Calluna, Playlist Script

### Tier 2 — Brand owners (full source files including AI)

For Victoria and Emmanuel only. The Source Files tab only appears in the navigation when this password is entered.

**Default test password:** `emmyvictoria` (or `brandowners` or `eastonadmin`)

Unlocks the Source Files tab containing:
- Parent logos with editable AI files
- Every ministry's logo pack with editable AI files

**Why two tiers:** the user pointed out that giving every ministry center the AI files invites edits and drift. Each ministry would end up with their own version of the wordmark with slightly different spacing, color, etc. Centralizing the editable source means there is exactly one canonical logo and any change goes through Easton.

**Production change:** before launch, change the passwords from the test ones above to real ones. Edit `MINISTRY_PASSWORDS` and `ADMIN_PASSWORDS` arrays in `scripts.js`. For better security, swap the JS-side check to a real server-side authentication when we move to WordPress or HubSpot.

---

## Can we move this to WordPress?

Yes. Three paths.

### Path 1 — As a single subpage of hcfm.org (simplest)

Use the **Custom HTML / Code Block** feature in the WordPress page editor:

1. Create a new page in WordPress: title "Brand Identity," slug `brand-identity`, full-width template
2. Paste the entire `<main>` section of `index.html` into a Custom HTML block
3. Upload `styles.css` and `scripts.js` to `wp-content/themes/<theme>/brand-page/` and enqueue them only on this page (snippet in `functions.php`)
4. Upload all assets (`assets/`, `downloads/`) to `wp-content/uploads/brand/`
5. Update asset paths in HTML/CSS/JS from `assets/...` to `/wp-content/uploads/brand/...`

The brand page lives at `hcfm.org/brand-identity` and inherits the parent site's topbar, header, and footer.

### Path 2 — Each section as a Gutenberg block

Convert each routed page (Symbol, Logos, Colors, etc.) to a native Gutenberg block. The marketing team can then edit copy without touching code. More setup, more long-term flexibility.

Recommended for sections that change often: Voice, FAQ, Help. Keep the rest as Custom HTML so the interactive bits (color cubes, ministry detail pages, downloads) keep working.

### Path 3 — Subdomain (most isolation)

Deploy at `brand.hcfm.org` as a static site. Best if we want the brand portal to feel separate from the donor-facing site.

---

## Can we move this to HubSpot?

Yes. HubSpot CMS Hub Pro+ supports custom HTML pages with full JavaScript.

1. Pages → Create page → Use blank template
2. Edit Source → paste the full HTML
3. Upload assets to HubSpot File Manager. Replace asset paths with `{{ get_asset_url('/brand/...') }}` Jinja syntax
4. Enqueue CSS and JS via HubSpot's site-level head HTML or per-page module
5. For the locked tier, use HubSpot's native **Memberships** feature instead of the JS password gate. Memberships gives per-user logins and full audit trail, and lives in HubSpot CRM

The brand helper, ministry detail pages, color cubes, and other interactive bits work identically inside HubSpot CMS — they are vanilla JS with no framework dependency.

**Path of least resistance:** since HCFM already has HubSpot for marketing, ship the brand portal there. The integration with CRM, forms, and tracking is one less integration to manage.

---

## What needs to change before the public launch

These are the items I have flagged in the page itself or that came up during the build:

1. **Passwords.** Replace the test passwords (`hcfm2026`, `emmyvictoria`) with real ones before going live.
2. **Form action URL.** Move from `mailto:` to a real form endpoint (Gravity Forms, HubSpot Forms, Formspree).
3. **Translations.** French, Spanish, Portuguese, Swahili — currently placeholders. Translation copy needs to be sourced from Victoria and the international team.
4. **Source files for Yellow Gold.** None of the existing 700+ logo files include the new Yellow Gold (#FFB500) primary variant. Either commission new variants or document this as a known gap.
5. **Sub-ministry list.** The current 24 in the directory are from the SharePoint roster (September 2020). The new audit references Burkina Faso, Papua New Guinea, and Australia as newer ministries. Need authoritative current list from Margaret or Allan.
6. **Voice and tone copy.** Drafted. Victoria reviews before publishing.
7. **Photography.** Two of the five Imagery cards are placeholders. Need real photos from the working folder once selected.
8. **Real authentication.** The JS-side password gate is appropriate for an internal-only mockup. Production should use server-side auth (WP plugin or HubSpot Memberships).
9. **Analytics.** Add Google Analytics or HubSpot tracking once the URL is live, so we can see what ministry centers actually click on.
10. **Yellow Gold logo files.** Existing pack does not include #FFB500 variants. Commission these before public launch or note it as a documented gap on the page.

---

## File structure recap

```
Brand_Page_Mockup/
├── index.html                  18-route SPA, sidebar + content
├── styles.css                  Design tokens, all components
├── scripts.js                  Routing, gate, ministry detail, chat, lightbox
├── README.md                   Architecture + deploy
├── HANDOFF_WORDPRESS.md        WP / Gutenberg conversion guide
├── HANDOFF_HUBSPOT.md          HubSpot CMS conversion guide
├── FONT_LICENSING.md           Whitney / Calluna / Playlist Script licensing
├── DEPLOYMENT_NOTES.md         This file
├── assets/
│   ├── fonts/                  Whitney 6 weights, Calluna 4, Playlist Script
│   ├── logos/                  Parent mark + 4 logotypes × 4 colors (PNG)
│   ├── photography/            Father Peyton, Faith and Family Day, Day 1
│   ├── previews/               Per-ministry logo previews (PNG)
│   ├── ministry-manifest.json  Lookup of actual file names per ministry
│   └── sub-ministries/         Source folders (gitignored / large)
└── downloads/
    ├── public/                 5 brand PDFs
    ├── fonts/                  Font ZIPs + individual OTFs
    ├── logos/
    │   ├── parent/             PNG/JPG only — public
    │   └── ministries/         PNG/JPG only — 24 ministries
    └── source-files/           Brand-owner restricted (AI / EPS / PDF)
        ├── parent/
        └── ministries/
```

---

For questions: Emmanuel Epau · `eepau@hcfm.org`
